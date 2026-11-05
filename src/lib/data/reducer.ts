// This project is proprietary software. All rights reserved.
// See the LICENSE file in the project root for details.
//
// Copyright (c) 2026 Florian Reuth <git@florianreuth.de>

import { Immer } from "immer";
import { createId } from "../id.ts";
import type {
    AppData,
    Booth,
    CollectionItem,
    CollectionKey,
    EventInfo,
    Floor,
    Id,
    Identifiable,
    NewItem,
    ScheduleEntryType,
} from "../types.ts";
import { byTimeSlotOrder, scheduleEntryId } from "./collections.ts";
import { createFloor, NEW_FLOOR_LABEL } from "./defaults.ts";
import { type FloorItemKey, type FloorItemTypes, placeBooth, removeBooth } from "./floorPlan.ts";

type CollectionAction = {
    [K in CollectionKey]:
    | { type: "collection/add"; collection: K; item: NewItem<CollectionItem<K>> }
    | { type: "collection/update"; collection: K; id: Id; patch: Partial<CollectionItem<K>> }
    | { type: "collection/remove"; collection: K; id: Id }
}[CollectionKey];

type FloorItemAction = {
    [K in FloorItemKey]:
    | { type: "floorItem/add"; collection: K; floorId: Id; item: NewItem<FloorItemTypes[K]> }
    | { type: "floorItem/update"; collection: K; floorId: Id; id: Id; patch: Partial<FloorItemTypes[K]> }
    | { type: "floorItem/remove"; collection: K; floorId: Id; id: Id }
}[FloorItemKey];

export type DataAction =
    | { type: "data/replace"; data: AppData }
    | { type: "event/update"; patch: Partial<EventInfo> }
    | CollectionAction
    | FloorItemAction
    | { type: "floor/add"; id?: Id; label?: string }
    | { type: "floor/update"; id: Id; patch: Partial<Floor> }
    | { type: "floor/remove"; id: Id }
    | { type: "exhibitor/rename"; id: Id; nextId: Id }
    | { type: "booth/place"; floorId: Id; exhibitorId: Id; patch: Partial<Booth> }
    | { type: "booth/remove"; exhibitorId: Id }
    | { type: "schedule/set"; classId: Id; timeSlotId: Id; zoneId: Id; value: ScheduleEntryType | null };

// The store data was never frozen and components may hold on to items, so results stay mutable like before
const { produce } = new Immer({ autoFreeze: false });

function removeById(items: Identifiable[], id: Id): void {
    const index = items.findIndex((item) => item.id === id);
    if (index >= 0) {
        items.splice(index, 1);
    }
}

// Mirrors the foreign key actions of the database, so optimistic updates match what the server stores
const removalCascades: Partial<Record<CollectionKey, (draft: AppData, id: Id) => void>> = {
    exhibitors: (draft, id) => {
        removeBooth(draft.floorPlan, id);
        draft.talks = draft.talks.filter((talk) => talk.exhibitorId !== id);
    },
    classes: (draft, id) => void (draft.classSchedule = draft.classSchedule.filter((entry) => entry.classId !== id)),
    timeSlots: (draft, id) => void (draft.classSchedule = draft.classSchedule.filter((entry) => entry.timeSlotId !== id)),
    groups: (draft, id) => void (draft.classSchedule = draft.classSchedule.filter((entry) => entry.zoneId !== id)),
    categories: (draft, id) => {
        for (const exhibitor of draft.exhibitors) {
            if (exhibitor.categoryId === id) {
                delete exhibitor.categoryId;
            }
        }
    },
    rooms: (draft, id) => {
        for (const talk of draft.talks) {
            if (talk.roomId === id) {
                delete talk.roomId;
            }
        }
    },
};

function applyCollectionAction(draft: AppData, action: CollectionAction): void {
    const items = draft[action.collection] as Identifiable[];
    switch (action.type) {
        case "collection/add":
            items.push({ ...action.item, id: action.item.id || createId() });
            break;
        case "collection/update":
            Object.assign(items.find((item) => item.id === action.id) ?? {}, action.patch);
            break;
        case "collection/remove":
            removeById(items, action.id);
            removalCascades[action.collection]?.(draft, action.id);
            break;
    }
    if (action.collection === "timeSlots") {
        draft.timeSlots.sort(byTimeSlotOrder);
    }
}

function applyFloorItemAction(draft: AppData, action: FloorItemAction): void {
    const floor = draft.floorPlan.floors.find((item) => item.id === action.floorId);
    if (!floor) {
        return;
    }
    const items = floor[action.collection] as Identifiable[];
    switch (action.type) {
        case "floorItem/add":
            items.push({ ...action.item, id: action.item.id || createId() });
            break;
        case "floorItem/update":
            Object.assign(items.find((item) => item.id === action.id) ?? {}, action.patch);
            break;
        case "floorItem/remove":
            removeById(items, action.id);
            break;
    }
}

function setScheduleEntry(draft: AppData, { classId, timeSlotId, zoneId, value }: Extract<DataAction, { type: "schedule/set" }>): void {
    const id = scheduleEntryId(classId, timeSlotId, zoneId);
    const existing = draft.classSchedule.find((entry) => entry.id === id);
    if (!value) {
        removeById(draft.classSchedule, id);
    } else if (existing) {
        existing.type = value;
    } else {
        draft.classSchedule.push({ id, classId, timeSlotId, zoneId, type: value });
    }
}

function renameExhibitor(draft: AppData, id: Id, nextId: Id): void {
    const exhibitor = draft.exhibitors.find((item) => item.id === id);
    if (!exhibitor || !nextId || nextId === id) {
        return;
    }
    exhibitor.id = nextId;
    for (const talk of draft.talks) {
        if (talk.exhibitorId === id) {
            talk.exhibitorId = nextId;
        }
    }
    for (const floor of draft.floorPlan.floors) {
        for (const booth of floor.booths) {
            if (booth.exhibitorId === id) {
                booth.exhibitorId = nextId;
            }
        }
    }
}

/** Pure state transition used for optimistic updates on the client; unchanged state keeps its identity. */
export function dataReducer(state: AppData, action: DataAction): AppData {
    if (action.type === "data/replace") {
        return action.data;
    }

    return produce(state, (draft) => {
        const { floors } = draft.floorPlan;
        switch (action.type) {
            case "event/update":
                Object.assign(draft.event, action.patch);
                break;
            case "collection/add":
            case "collection/update":
            case "collection/remove":
                applyCollectionAction(draft, action);
                break;
            case "floorItem/add":
            case "floorItem/update":
            case "floorItem/remove":
                applyFloorItemAction(draft, action);
                break;
            case "floor/add":
                floors.push(createFloor(action.id || createId(), action.label || NEW_FLOOR_LABEL));
                break;
            case "floor/update":
                Object.assign(floors.find((floor) => floor.id === action.id) ?? {}, action.patch);
                break;
            case "floor/remove":
                if (floors.length > 1) {
                    removeById(floors, action.id);
                }
                break;
            case "exhibitor/rename":
                renameExhibitor(draft, action.id, action.nextId);
                break;
            case "booth/place":
                placeBooth(draft.floorPlan, action.floorId, action.exhibitorId, action.patch);
                break;
            case "booth/remove":
                removeBooth(draft.floorPlan, action.exhibitorId);
                break;
            case "schedule/set":
                setScheduleEntry(draft, action);
                break;
        }
    });
}
