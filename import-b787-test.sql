-- B787 International 90min Turn - Test Schedule
-- Source: B787 INT PTS v1.2.pdf
-- Step 1: Run this to create the schedule, then copy the returned ID
-- Step 2: Replace AIRCRAFT_ID_HERE below and run the rest

-- STEP 1: Create the aircraft/schedule
INSERT INTO aircraft (name) 
VALUES ('B787 International - 90min Turn')
RETURNING id;

-- STEP 2: After getting the ID, replace AIRCRAFT_ID_HERE below and run this section
-- Note: You can select just this section and run it separately

INSERT INTO key_time (aircraft_id, name, offset_minutes, sort_order, is_key_time, department, duration_minutes, notes, is_conditional, category) VALUES
('AIRCRAFT_ID_HERE', 'Check-in for baggage acceptance open', -180, 1, false, 'Automated', null, null, false, 'Pre-Arrival'),
('AIRCRAFT_ID_HERE', 'Cargo & mail estimates from Freight', -180, 2, false, 'Freight', null, null, false, 'Pre-Arrival'),
('AIRCRAFT_ID_HERE', 'EZFW to Flight Dispatch', -120, 3, false, 'Freight Planning Office, Engineering', null, null, false, 'Pre-Arrival'),
('AIRCRAFT_ID_HERE', 'Engineering defects advised from aircraft', -120, 4, false, 'Engineering', null, null, false, 'Pre-Arrival'),
('AIRCRAFT_ID_HERE', 'Provisional fuel figures submitted', -100, 5, false, 'Dispatch', null, null, false, 'Pre-Arrival'),
('AIRCRAFT_ID_HERE', 'GSP on bay with equipment', -95, 6, false, 'GSP - Fleet/Ramp', null, null, false, 'Arrival Preparation'),
('AIRCRAFT_ID_HERE', 'Freight delivered/positioned at staging area', -95, 7, false, 'Freight', null, null, false, 'Arrival Preparation'),
('AIRCRAFT_ID_HERE', 'CSA at gate', -95, 8, false, 'Airports Customer', null, null, false, 'Arrival Preparation'),
('AIRCRAFT_ID_HERE', 'Final cargo & mail figures from Freight', -90, 9, false, 'Freight', null, null, false, 'Arrival Preparation'),
('AIRCRAFT_ID_HERE', 'Aircraft on bay', -90, 10, true, 'Flight Ops', null, null, false, 'Arrival'),
('AIRCRAFT_ID_HERE', 'GPU connection – commence checks including tech log', -89, 11, false, 'Engineering', null, null, false, 'Arrival'),
  ('AIRCRAFT_ID_HERE', 'Holds offload commence', -88, 12, false, 'GSP - Ramp', 53, 'Also 73min variant', false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Toilet waste and potable water service commenced', -88, 13, false, 'Refueller', null, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Fuel dispenser connected and pumping', -88, 14, false, 'Refueller', null, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Passenger disembarkation commence', -87, 15, false, 'Airports Cust/Cabin Crew', 10, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Passenger disembarkation complete', -77, 16, false, 'Cabin Crew', null, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Catering exchange commence', -77, 17, false, 'GSP – Catering', 44, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Fleet presentation commence', -77, 18, false, 'GSP – Fleet', 37, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Baggage acceptance and check in closed', -60, 19, false, 'Automated', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Load instruction report (LIR) sent to Ramp', -60, 20, false, 'Load Control', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'CSA at gate', -60, 21, false, 'Airports Customer', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Aircraft security checks commence', -52, 22, false, 'Airport Authorities', 12, null, false, 'Security'),
('AIRCRAFT_ID_HERE', 'Final fuel figures submitted by Flight Crew', -50, 23, false, 'Flight Ops', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Cabin Crew onboard and checks commence', -45, 24, false, 'Cabin Crew', 10, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Ineligible to board list prints at gate – automatic', -45, 25, false, 'Automated', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'CSA opens boarding and commences departure procedures', -45, 26, false, 'Airports Customer', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Standby passengers finalised', -45, 27, false, 'Airports Customer', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Aircraft security checks complete', -40, 28, false, 'Airport Authorities', null, null, false, 'Security'),
('AIRCRAFT_ID_HERE', 'Fleet presentation complete', -40, 29, false, 'GSP – Fleet', null, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Provisional load sheet and NOTOC to Flight Deck', -40, 30, false, 'Load Control', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Cabin Crew checks complete', -35, 31, false, 'Cabin Crew', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Toilet waste and potable water service complete', -35, 32, false, 'GSP - Ramp', null, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Boarding clearance obtained', -35, 33, false, 'Airports Customer', 30, null, false, 'Boarding'),
('AIRCRAFT_ID_HERE', 'Latest time for CSA to scan first boarding pass', -35, 34, true, 'Airports Customer', null, null, false, 'Boarding'),
('AIRCRAFT_ID_HERE', 'Catering exchange complete', -33, 35, false, 'GSP - Catering', null, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Flight Crew at aircraft maintaining VHF listening watch', -30, 36, false, 'Flight Ops', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Flight finalised in system', -30, 37, false, 'Airports Customer', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Flight Crew checks complete', -20, 38, false, 'Flight Ops', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Seat check & offload procedures commence', -20, 39, false, 'Airports Customer', null, null, false, 'Boarding'),
('AIRCRAFT_ID_HERE', 'Baggage room call gate for final clearance', -20, 40, false, 'Airports Customer', null, null, false, 'Departure Preparation'),
('AIRCRAFT_ID_HERE', 'Final boarding call', -15, 41, false, 'Airports Customer', null, null, false, 'Boarding'),
('AIRCRAFT_ID_HERE', 'Refuelling complete', -15, 42, false, 'Refueller', null, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Engineering checks complete', -15, 43, false, 'Engineering', null, null, false, 'Turnaround'),
('AIRCRAFT_ID_HERE', 'Loading complete', -13, 44, false, 'GSP - Ramp', null, null, false, 'Loading'),
('AIRCRAFT_ID_HERE', 'Tech log complete', -10, 45, false, 'Engineering', null, null, false, 'Departure'),
('AIRCRAFT_ID_HERE', 'Latest time for Ramp to call through clearance to Load Control', -10, 46, false, 'GSP – Ramp', null, null, false, 'Departure'),
('AIRCRAFT_ID_HERE', 'Seat check & offload procedures complete', -10, 47, false, 'Airports Customer', null, null, false, 'Boarding'),
('AIRCRAFT_ID_HERE', 'Final passenger clearance to Load Control', -10, 48, false, 'Airports Customer', null, null, false, 'Departure'),
('AIRCRAFT_ID_HERE', 'Passenger manifest delivered to CSM', -10, 49, false, 'Airports Customer', null, null, false, 'Departure'),
('AIRCRAFT_ID_HERE', 'Passenger loading complete', -5, 50, false, 'Cabin Crew', null, null, false, 'Boarding'),
('AIRCRAFT_ID_HERE', 'Engineer available of headset', -5, 51, false, 'Engineering', null, null, false, 'Departure'),
('AIRCRAFT_ID_HERE', 'All ground equipment (GSE) clear', -3, 52, false, 'GSP – All', null, null, false, 'Departure'),
('AIRCRAFT_ID_HERE', 'Latest time for final load sheet transmitted by Load Control', -3, 53, false, 'Load Control', null, null, false, 'Departure'),
('AIRCRAFT_ID_HERE', 'Doors closed & retract aerobridge', -3, 54, true, 'Airports Customer', null, null, false, 'Departure'),
('AIRCRAFT_ID_HERE', 'Aircraft Pushback / Aircraft Off Blocks', 0, 55, true, 'Engineering', null, 'Reference point', false, 'Departure');
