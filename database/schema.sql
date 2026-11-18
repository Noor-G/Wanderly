
-- all of this is used when and if we need to create the tables again
-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  preferences JSONB DEFAULT '{}'::JSONB
);

-- Create attractions table
CREATE TABLE IF NOT EXISTS attractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    location TEXT,
    category TEXT,
    cost DECIMAL(10, 2),
    requires_booking BOOLEAN DEFAULT TRUE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the bookings table with correct column names
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  attraction_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  cost DECIMAL(10, 2),
  number_of_people INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the itinerary table
CREATE TABLE IF NOT EXISTS itinerary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the itinerary_items table
CREATE TABLE IF NOT EXISTS itinerary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itinerary(id) ON DELETE CASCADE,
  attraction_id UUID REFERENCES attractions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_attraction_id ON bookings(attraction_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_user_id ON itinerary(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_id ON itinerary_items(itinerary_id);

-- Sample data for attractions
INSERT INTO attractions (name, description, image_url, location, category, cost, requires_booking, latitude, longitude) VALUES
('Gardens by the Bay', 'Iconic garden with Supertree structures', '/placeholder.svg?height=300&width=500', 'Marina Bay Sands', 'nature', 25.50, TRUE, 1.2815, 103.8636),
('Marina Bay Sands', 'Iconic hotel with rooftop infinity pool', '/placeholder.svg?height=300&width=500', 'Marina Bay', 'hotel', 35.70, TRUE, 1.2834, 103.8607),
('Singapore Zoo', 'World-class zoo with open enclosures', '/placeholder.svg?height=300&width=500', 'Mandai', 'wildlife', 21.00, TRUE, 1.4043, 103.7930),
('Sentosa Island', 'Resort island with beaches and attractions', '/placeholder.svg?height=300&width=500', 'Sentosa', 'resort', 63.00, TRUE, 1.2494, 103.8303),
('Merlion Park', 'Iconic statue and landmark of Singapore', '/placeholder.svg?height=300&width=500', 'Marina Bay', 'landmark', 0.00, FALSE, 1.2868, 103.8545),
('Universal Studios Singapore', 'Theme park with movie-themed rides', '/placeholder.svg?height=300&width=500', 'Sentosa', 'theme park', 79.00, TRUE, 1.2540, 103.8238),
('S.E.A. Aquarium', 'One of the largest aquariums in the world', '/placeholder.svg?height=300&width=500', 'Sentosa', 'aquarium', 35.00, TRUE, 1.2587, 103.8198),
('Chinatown', 'Historic district with shops and temples', '/placeholder.svg?height=300&width=500', 'Chinatown', 'cultural', 0.00, FALSE, 1.2834, 103.8440),
('Little India', 'Vibrant district with Indian culture', '/placeholder.svg?height=300&width=500', 'Little India', 'cultural', 0.00, FALSE, 1.3070, 103.8498),
('Singapore Flyer', 'Giant observation wheel', '/placeholder.svg?height=300&width=500', 'Marina Bay', 'attraction', 33.00, TRUE, 1.2890, 103.8631);

-- Create RLS policies for attractions
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attractions are viewable by everyone" ON attractions FOR SELECT USING (true);
CREATE POLICY "Attractions are insertable by authenticated users" ON attractions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Attractions are updatable by authenticated users" ON attractions FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookings" ON bookings FOR DELETE USING (auth.uid() = user_id);
