# 🚀 Backend Setup Guide

## 📋 **What We've Built**

A comprehensive Django REST API backend for the Road Trip Planner with:

### **✅ Core Features Implemented:**

1. **🔐 Authentication System**

   - Custom User model with preferences
   - JWT-based authentication
   - User registration, login, logout
   - Profile management

2. **🗺️ Trip Management**

   - Full CRUD operations for trips
   - Stop/waypoint management with drag & drop reordering
   - Trip sharing with permission levels
   - Automatic route statistics calculation

3. **📍 Places Integration**

   - Google Places API integration
   - Place search and details caching
   - Nearby places discovery

4. **🛣️ Route Calculation**

   - Google Directions API integration
   - Route caching and optimization
   - Travel time and distance calculation

5. **🌤️ Weather Integration**

   - OpenWeatherMap API integration
   - Current weather and forecasts
   - Location-based weather data

6. **⭐ Recommendations Engine**
   - Smart recommendations based on trip context
   - Nearby attractions, restaurants, accommodations
   - Personalized suggestions

## 🛠️ **Setup Instructions**

### **1. Environment Setup**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### **2. Environment Configuration**

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required API Keys:**

- **Google Maps API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/)
  - Enable: Places API, Directions API, Geocoding API
- **OpenWeatherMap API Key**: Get from [OpenWeatherMap](https://openweathermap.org/api)

### **3. Database Setup**

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json
```

### **4. Redis Setup (for caching)**

```bash
# Install Redis (macOS with Homebrew)
brew install redis

# Start Redis server
redis-server

# Or run in background
brew services start redis
```

### **5. Run the Development Server**

```bash
# Start Django development server
python manage.py runserver

# In another terminal, start Celery worker (for background tasks)
celery -A config worker --loglevel=info
```

## 🔌 **API Endpoints**

### **Authentication Endpoints**

```
POST   /api/auth/register/          # User registration
POST   /api/auth/login/             # User login
POST   /api/auth/logout/            # User logout
GET    /api/auth/me/                # Get current user
PUT    /api/auth/profile/           # Update user profile
PUT    /api/auth/preferences/       # Update user preferences
POST   /api/auth/token/refresh/     # Refresh JWT token
```

### **Trip Management Endpoints**

```
GET    /api/trips/                  # List user's trips
POST   /api/trips/                  # Create new trip
GET    /api/trips/{id}/             # Get trip details
PUT    /api/trips/{id}/             # Update trip
DELETE /api/trips/{id}/             # Delete trip
POST   /api/trips/{id}/calculate/   # Recalculate trip stats

# Stop Management
GET    /api/trips/{id}/stops/       # List trip stops
POST   /api/trips/{id}/stops/       # Add stop to trip
PUT    /api/trips/{id}/stops/{id}/  # Update stop
DELETE /api/trips/{id}/stops/{id}/  # Remove stop
POST   /api/trips/{id}/stops/reorder/ # Reorder stops

# Trip Sharing
GET    /api/trips/{id}/shares/      # List trip shares
POST   /api/trips/{id}/shares/      # Share trip with user
PUT    /api/trips/{id}/shares/{id}/ # Update share permissions
DELETE /api/trips/{id}/shares/{id}/ # Remove share

# Special Endpoints
GET    /api/trips/shared/           # Get trips shared with user
GET    /api/trips/public/           # Get public trips
```

### **Places & Search Endpoints**

```
GET    /api/places/search/?q={query}           # Search places
GET    /api/places/{place_id}/                 # Get place details
GET    /api/places/nearby/?lat={}&lng={}       # Get nearby places
```

### **Route Calculation Endpoints**

```
POST   /api/routes/calculate/       # Calculate route between waypoints
GET    /api/routes/{id}/            # Get cached route details
```

### **Weather Endpoints**

```
GET    /api/weather/current/?lat={}&lng={}     # Current weather
GET    /api/weather/forecast/?stops=[]         # Weather for multiple stops
```

### **Recommendations Endpoints**

```
GET    /api/recommendations/?lat={}&lng={}     # Get recommendations
GET    /api/recommendations/nearby/?lat={}&lng={}&type={} # Nearby by type
```

## 📊 **API Usage Examples**

### **Create a Trip**

```bash
curl -X POST http://localhost:8000/api/trips/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "California Coast Road Trip",
    "description": "Epic coastal drive",
    "route_type": "scenic",
    "start_date": "2024-08-01",
    "end_date": "2024-08-07"
  }'
```

### **Add a Stop**

```bash
curl -X POST http://localhost:8000/api/trips/1/stops/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Golden Gate Bridge",
    "address": "Golden Gate Bridge, San Francisco, CA",
    "latitude": 37.8199,
    "longitude": -122.4783,
    "stop_type": "waypoint",
    "order": 1
  }'
```

### **Search Places**

```bash
curl "http://localhost:8000/api/places/search/?q=restaurants+in+san+francisco" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Get Weather**

```bash
curl "http://localhost:8000/api/weather/current/?lat=37.7749&lng=-122.4194" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 **Frontend Integration**

Update your frontend API service to use the real backend:

```typescript
// In frontend/src/services/api.ts
const API_BASE_URL = 'http://localhost:8000/api';

// Replace mock implementations with real API calls
async searchPlaces(query: string) {
  const response = await fetch(`${API_BASE_URL}/places/search/?q=${query}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  return response.json();
}
```

## 🚀 **Production Deployment**

### **Environment Variables for Production**

```bash
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECRET_KEY=your-production-secret-key

# Use PostgreSQL for production
DB_ENGINE=django.db.backends.postgresql
DB_NAME=roadtrip_prod
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
```

### **Additional Production Setup**

1. **Static Files**: Configure AWS S3 or similar for static file storage
2. **Database**: Use PostgreSQL instead of SQLite
3. **Caching**: Use Redis for production caching
4. **Background Tasks**: Deploy Celery workers
5. **Monitoring**: Add logging and error tracking (Sentry)

## 🧪 **Testing**

```bash
# Run tests
python manage.py test

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

## 📈 **Performance Optimization**

The backend includes several performance optimizations:

1. **Database Indexing**: Strategic indexes on frequently queried fields
2. **API Response Caching**: Redis caching for external API responses
3. **Query Optimization**: Select_related and prefetch_related usage
4. **Background Tasks**: Celery for heavy computations
5. **Pagination**: Built-in pagination for large datasets

## 🔒 **Security Features**

1. **JWT Authentication**: Secure token-based authentication
2. **Permission System**: Granular permissions for trip access
3. **Rate Limiting**: Built-in rate limiting for API endpoints
4. **Input Validation**: Comprehensive input validation and sanitization
5. **CORS Configuration**: Proper CORS setup for frontend integration

Your backend is now ready to power the dynamic frontend! 🎉
