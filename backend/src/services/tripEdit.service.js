const Place = require("../models/Place");

class TripEditError extends Error {}

// `trip` may already be populated (the chat flow populates it to build prompt
// context). Depopulate first so id comparisons/mutations work against plain
// ObjectIds, not populated Place documents — avoids the classic bug of
// comparing a populated subdocument's .toString() against a real id string.
async function applyEdit(trip, { action, targetDayNumber, targetPlaceId, newPlaceId }) {
  if (action === "none") return null;

  trip.depopulate("days.items.placeId");

  const day = trip.days.find((d) => d.dayNumber === targetDayNumber);
  if (!day) throw new TripEditError(`Day ${targetDayNumber} not found on this trip`);

  const itemIndex = day.items.findIndex((i) => i.placeId.toString() === targetPlaceId);
  if (itemIndex === -1) throw new TripEditError(`Target place not found on day ${targetDayNumber}`);

  const removedItem = day.items[itemIndex];
  const removedPlace = await Place.findById(removedItem.placeId);

  let addedPlace = null;

  if (action === "replace_item") {
    if (!newPlaceId) throw new TripEditError("newPlaceId is required for replace_item");
    addedPlace = await Place.findById(newPlaceId);
    if (!addedPlace) throw new TripEditError("newPlaceId does not reference a real place");

    day.items[itemIndex] = {
      placeId: addedPlace._id,
      order: removedItem.order,
      startTime: removedItem.startTime,
      endTime: removedItem.endTime,
      note: removedItem.note,
    };
  } else if (action === "remove_item") {
    day.items.splice(itemIndex, 1);
  } else {
    throw new TripEditError(`Unknown action: ${action}`);
  }

  await trip.save();
  await trip.populate("days.items.placeId");

  return {
    trip,
    editSummary: {
      action,
      removedPlace: removedPlace ? { id: removedPlace._id, name: removedPlace.name } : null,
      addedPlace: addedPlace ? { id: addedPlace._id, name: addedPlace.name } : null,
    },
  };
}

module.exports = { applyEdit, TripEditError };
