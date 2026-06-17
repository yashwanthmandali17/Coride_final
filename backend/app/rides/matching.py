import math
from datetime import datetime, timedelta, timezone
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.rides.models import Ride

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth's surface in kilometers."""
    # Earth radius in kilometers
    R = 6371.0
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return R * c

def ensure_utc(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware and set to UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def match_rides(
    db: Session,
    s_lat: float,
    s_lng: float,
    d_lat: float,
    d_lng: float,
    preferred_time: datetime = None,
    radius_km: float = 5.0,
    time_window_hours: float = 24.0
) -> List[Tuple[Ride, float, float]]:
    """
    Find rides matching source and destination within search radius.
    Returns list of tuples: (Ride, source_distance, destination_distance).
    Sorted by total distance offset and time proximity.
    """
    now = datetime.now(timezone.utc)
    
    # Query all active, published rides with available seats starting from now
    query = db.query(Ride).filter(
        Ride.status == "published",
        Ride.seats_available > 0,
        Ride.departure_time >= now
    )
    
    # Filter by departure time window if provided
    if preferred_time:
        preferred_time = ensure_utc(preferred_time)
        start_window = preferred_time - timedelta(hours=time_window_hours)
        end_window = preferred_time + timedelta(hours=time_window_hours)
        # Ensure we don't look in the past relative to right now
        start_window = max(start_window, now)
        query = query.filter(Ride.departure_time.between(start_window, end_window))
        
    all_rides = query.all()
    matched = []
    
    for ride in all_rides:
        dist_s = haversine_distance(ride.source_lat, ride.source_lng, s_lat, s_lng)
        dist_d = haversine_distance(ride.destination_lat, ride.destination_lng, d_lat, d_lng)
        
        # Check if both source and destination are within the search radius
        if dist_s <= radius_km and dist_d <= radius_km:
            matched.append((ride, dist_s, dist_d))
            
    # Sorting function:
    # 1. Total distance offset (closer is better)
    # 2. Time proximity to preferred time (if provided) or departure time (earlier is better)
    # 3. Final cost (cheaper is better)
    def sort_key(item):
        ride_item, d_s, d_d = item
        total_offset = d_s + d_d
        
        ride_dep_time = ensure_utc(ride_item.departure_time)
        time_diff_sec = 0.0
        if preferred_time:
            time_diff_sec = abs((ride_dep_time - preferred_time).total_seconds())
        else:
            time_diff_sec = (ride_dep_time - now).total_seconds()
            
        return (total_offset, time_diff_sec, ride_item.final_cost)
        
    matched.sort(key=sort_key)
    return matched
