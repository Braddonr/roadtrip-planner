# 🏗️ Backend Architecture for Dynamic Road Trip Planner

## 📋 **API Requirements Analysis**

Based on the dynamic frontend, we need these core APIs:

### **1. Trip Management APIs**
```
GET    /api/trips/                    # List user's trips
POST   /api/trips/                    # Create new trip
GET    /api/trips/{id}/               # Get trip details
PUT    /api/trips/{id}/               # Update trip
DELETE /api/trips/{id}/               # Delete trip
POST   /api/trips/{id}/calculate/     # Recalculate trip stats
```

### **2. Stop/Waypoint APIs**
```
GET    /api/trips/{id}/stops/         # Get trip stops
POST   /api/trips/{id}/stops/         # Add stop to trip
PUT    /api/trips/{id}/stops/{stop_id}/ # Update stop
DELETE /api/trips/{id}/stops/{stop_id}/ # Remove stop
POST   /api/trips/{id}/stops/reorder/ # Reorder stops
```

### **3. Search & Discovery APIs**
```
GET    /api/places/search/?q={query}  # Search places
GET    /api/places/{id}/              # Get place details
GET    /api/places/nearby/?lat={}&lng={}&type={} # Nearby recommendations
```

### **4. Route & Navigation APIs**
```
POST   /api/routes/calculate/         # Calculate route between waypoints
GET    /api/routes/{id}/              # Get cached route
```

### **5. Weather APIs**
```
GET    /api/weather/?lat={}&lng={}    # Get weather for location
GET    /api/weather/forecast/?stops=[] # Weather for multiple stops
```

### **6. User Management APIs**
```
POST   /api/auth/register/            # User registration
POST   /api/auth/login/               # User login
POST   /api/auth/logout/              # User logout
GET    /api/auth/me/                  # Get current user
PUT    /api/auth/me/                  # Update user profile
```

## 🗄️ **Database Schema Design**

### **Core Models:**

#### **User Model**
```python
class User(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    preferences = models.JSONField(default=dict)  # User preferences
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### **Trip Model**
```python
class Trip(models.Model):
    ROUTE_TYPES = [
        ('fastest', 'Fastest Route'),
        ('scenic', 'Scenic Route'),
        ('custom', 'Custom Route'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    route_type = models.CharField(max_length=20, choices=ROUTE_TYPES, default='fastest')
    
    # Trip statistics (calculated)
    total_distance = models.FloatField(default=0)  # in miles
    total_time = models.FloatField(default=0)      # in hours
    estimated_fuel_cost = models.FloatField(default=0)
    
    # Trip dates
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    # Metadata
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### **Stop Model**
```python
class Stop(models.Model):
    STOP_TYPES = [
        ('start', 'Starting Point'),
        ('destination', 'Destination'),
        ('waypoint', 'Waypoint'),
    ]
    
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    name = models.CharField(max_length=200)
    address = models.TextField()
    
    # Location data
    latitude = models.FloatField()
    longitude = models.FloatField()
    place_id = models.CharField(max_length=200, blank=True)  # Google Places ID
    
    # Stop details
    stop_type = models.CharField(max_length=20, choices=STOP_TYPES, default='waypoint')
    order = models.PositiveIntegerField()  # Order in the trip
    
    # Timing
    arrival_time = models.TimeField(null=True, blank=True)
    departure_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    # Travel to next stop (calculated)
    travel_time_to_next = models.FloatField(null=True, blank=True)  # hours
    travel_distance_to_next = models.FloatField(null=True, blank=True)  # miles
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        unique_together = ['trip', 'order']
```

#### **Place Model** (Cache for external API data)
```python
class Place(models.Model):
    PLACE_TYPES = [
        ('attraction', 'Tourist Attraction'),
        ('restaurant', 'Restaurant'),
        ('accommodation', 'Accommodation'),
        ('gas_station', 'Gas Station'),
        ('park', 'Park'),
        ('museum', 'Museum'),
        ('other', 'Other'),
    ]
    
    place_id = models.CharField(max_length=200, unique=True)  # External API ID
    name = models.CharField(max_length=200)
    address = models.TextField()
    
    # Location
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    # Details
    place_type = models.CharField(max_length=50, choices=PLACE_TYPES)
    rating = models.FloatField(null=True, blank=True)
    price_level = models.IntegerField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Rich data
    photos = models.JSONField(default=list)  # Photo references
    opening_hours = models.JSONField(default=dict)
    reviews_summary = models.JSONField(default=dict)
    
    # Cache metadata
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### **Route Model** (Cache calculated routes)
```python
class Route(models.Model):
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name='route')
    
    # Route data from external API
    route_data = models.JSONField()  # Full route response from Google Directions
    polyline = models.TextField()    # Encoded polyline for map display
    
    # Calculated totals
    total_distance_meters = models.IntegerField()
    total_duration_seconds = models.IntegerField()
    
    # Route segments
    legs = models.JSONField(default=list)  # Individual legs between stops
    
    # Cache metadata
    calculated_at = models.DateTimeField(auto_now=True)
    is_valid = models.BooleanField(default=True)
```

## 🔧 **External API Integration**

### **Required External APIs:**

#### **1. Google Places API**
```python
# Services needed:
- Text Search API          # For place search
- Place Details API        # For detailed place info
- Nearby Search API        # For recommendations
- Place Photos API         # For place images
```

#### **2. Google Directions API**
```python
# For route calculation between waypoints
- Directions API           # Route calculation
- Distance Matrix API      # Travel times/distances
```

#### **3. OpenWeatherMap API**
```python
# For weather data
- Current Weather API      # Current conditions
- 5-day Forecast API       # Weather forecasts
```

#### **4. Optional Enhancement APIs**
```python
- Yelp Fusion API         # Restaurant/business data
- Foursquare Places API   # Additional place data
- GasBuddy API           # Gas prices
- TripAdvisor API        # Reviews and ratings
```

## 🏛️ **Django Backend Structure**

### **Apps Structure:**
```
backend/
├── config/                 # Django settings
├── apps/
│   ├── authentication/     # User management
│   ├── trips/             # Trip and stop management
│   ├── places/            # Place search and caching
│   ├── routes/            # Route calculation
│   ├── weather/           # Weather integration
│   └── recommendations/   # Recommendation engine
├── services/              # External API services
│   ├── google_places.py
│   ├── google_directions.py
│   ├── weather_service.py
│   └── cache_service.py
├── utils/                 # Shared utilities
└── requirements.txt
```

## 🚀 **Key Backend Features**

### **1. Smart Caching**
- Cache external API responses to reduce costs
- Invalidate cache based on time and usage patterns
- Redis for fast lookups

### **2. Background Tasks**
- Celery for async route calculations
- Periodic weather updates
- Batch recommendation updates

### **3. Real-time Updates**
- WebSocket support for live trip updates
- Real-time collaboration on shared trips

### **4. Performance Optimization**
- Database indexing on frequently queried fields
- API response caching
- Pagination for large datasets

### **5. Security & Privacy**
- JWT authentication
- Rate limiting on external API calls
- User data privacy controls

## 📊 **API Response Examples**

### **Trip Detail Response:**
```json
{
  "id": 1,
  "name": "California Coast Road Trip",
  "route_type": "scenic",
  "total_distance": 450.5,
  "total_time": 8.5,
  "estimated_fuel_cost": 85.50,
  "start_date": "2024-07-20",
  "end_date": "2024-07-25",
  "stops": [
    {
      "id": 1,
      "name": "San Francisco",
      "address": "San Francisco, CA, USA",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "order": 1,
      "stop_type": "start",
      "departure_time": "09:00:00"
    }
  ],
  "weather_forecasts": [...],
  "recommendations": [...],
  "created_at": "2024-07-15T10:30:00Z"
}
```

This architecture provides a solid foundation for your dynamic frontend while being scalable and maintainable!