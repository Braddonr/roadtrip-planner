# Geoapify API Setup Guide

## Getting Your Geoapify API Key

1. **Sign up for Geoapify**:

   - Go to [https://www.geoapify.com/](https://www.geoapify.com/)
   - Click "Get Started for Free"
   - Create an account

2. **Get Your API Key**:

   - After signing up, go to your dashboard
   - Navigate to "API Keys" section
   - Copy your API key

3. **Configure Your Environment**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and replace `your_geoapify_api_key_here` with your actual API key:
     ```
     VITE_GEOAPIFY_API_KEY=your_actual_api_key_here
     ```

## Features Enabled

With Geoapify integration, you get:

- **Place Search**: Search for any location worldwide
- **Interactive Map**: Real-time map with markers
- **Multiple Map Styles**: Switch between different map themes
- **Geolocation**: "Locate Me" functionality
- **Search Results on Map**: Visual markers for search results
- **Click to Add**: Click search results to add them as trip stops

## API Limits

The free tier includes:

- 3,000 requests per day
- All map styles
- Geocoding and search
- Static maps

## Troubleshooting

If the map doesn't load:

1. Check your API key is correct in `.env`
2. Restart your development server after adding the API key
3. Check browser console for any errors
4. Ensure you're not exceeding API limits

## Map Styles Available

- `osm-carto`: OpenStreetMap style (default)
- `osm-bright`: Bright OpenStreetMap style
- `positron`: Light minimalist style
- `dark-matter`: Dark theme style

Click the layers button (🗂️) in the map controls to cycle through styles.
