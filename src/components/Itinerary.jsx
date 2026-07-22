import DayCard from './DayCard.jsx';
import ItineraryMap from './ItineraryMap.jsx';

export default function Itinerary({
  days, tripLocation, tripLocationCoords, onUpdateDayField, onAddDay, onRemoveDay,
  onUpdateStopField, onAddStop, onRemoveStop
}) {
  return (
    <section className="trail">
      <div className="itinerary-head">
        <p className="sectitle">Itinerary</p>
      </div>
      <div style={{ position: 'relative' }}>
        <ItineraryMap days={days} tripLocation={tripLocation} tripLocationCoords={tripLocationCoords} />
        {days.length > 0 && <div className="trailline"></div>}
        {days.length === 0 && <div className="empty">No days yet — add the first leg of your trek.</div>}
        <div>
          {days.map((day, i) => (
            <DayCard
              key={day.id}
              day={day}
              index={i}
              onUpdateField={(field, val) => onUpdateDayField(day.id, field, val)}
              onRemove={() => onRemoveDay(day.id)}
              onUpdateStopField={(stopId, field, val) => onUpdateStopField(day.id, stopId, field, val)}
              onAddStop={() => onAddStop(day.id)}
              onRemoveStop={(stopId) => onRemoveStop(day.id, stopId)}
            />
          ))}
        </div>
        <div className="addday">
          <button onClick={onAddDay}>+ Add a day on the trail</button>
        </div>
      </div>
    </section>
  );
}
