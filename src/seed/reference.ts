/**
 * Static reference data for the seed generator: service regions, streets, people names, the
 * vehicle catalog, the vendor network, and adjusters. Everything here is fictional but shaped
 * like real data (approximate ZIP centroids, real VIN manufacturer codes, E.164 555-01xx phone numbers).
 *
 * Vandelay Industries is a Southeast regional carrier headquartered in Charlotte, NC, writing
 * business in eight metros across North Carolina, South Carolina, Tennessee, and Florida.
 */

export type Metro = 'CLT' | 'AVL' | 'GSP' | 'JAX' | 'CHS' | 'MEM' | 'KNX' | 'CHA';

export const METRO_INFO: Record<Metro, { city: string; state: string; areaCodes: string[]; tz: 'ET' | 'CT'; customers: number }> = {
  CLT: { city: 'Charlotte', state: 'NC', areaCodes: ['704', '980'], tz: 'ET', customers: 14 },
  AVL: { city: 'Asheville', state: 'NC', areaCodes: ['828'], tz: 'ET', customers: 6 },
  GSP: { city: 'Greenville', state: 'SC', areaCodes: ['864'], tz: 'ET', customers: 7 },
  JAX: { city: 'Jacksonville', state: 'FL', areaCodes: ['904'], tz: 'ET', customers: 11 },
  CHS: { city: 'Charleston', state: 'SC', areaCodes: ['843'], tz: 'ET', customers: 8 },
  MEM: { city: 'Memphis', state: 'TN', areaCodes: ['901'], tz: 'CT', customers: 9 },
  KNX: { city: 'Knoxville', state: 'TN', areaCodes: ['865'], tz: 'ET', customers: 8 },
  CHA: { city: 'Chattanooga', state: 'TN', areaCodes: ['423'], tz: 'ET', customers: 7 },
};

export interface Zip {
  zip: string;
  city: string;
  state: string;
  metro: Metro;
  lat: number;
  lon: number;
  streets: string[];
  areaCodes: string[];
  residential?: boolean;
}

const z = (zip: string, metro: Metro, lat: number, lon: number, streets: string[], residential = true): Zip => ({
  zip, city: METRO_INFO[metro].city, state: METRO_INFO[metro].state, metro, lat, lon, streets, areaCodes: METRO_INFO[metro].areaCodes, residential,
});

export const ZIPS: Zip[] = [
  // Charlotte, NC
  z('28202', 'CLT', 35.2271, -80.8431, ['N Tryon St', 'S College St', 'E Trade St', 'N Church St', 'E 5th St']),
  z('28203', 'CLT', 35.2087, -80.859, ['South Blvd', 'Camden Rd', 'East Blvd', 'Euclid Ave', 'Park Ave']),
  z('28204', 'CLT', 35.214, -80.827, ['Elizabeth Ave', 'Hawthorne Ln', 'E 7th St', 'Providence Rd', 'Clement Ave']),
  z('28205', 'CLT', 35.22, -80.788, ['Central Ave', 'The Plaza', 'Commonwealth Ave', 'Thomas Ave', 'Shamrock Dr']),
  z('28206', 'CLT', 35.251, -80.825, ['N Davidson St', 'E 36th St', 'Parkwood Ave', 'Spencer St', 'Allen St']),
  z('28207', 'CLT', 35.199, -80.826, ['Queens Rd', 'Selwyn Ave', 'Providence Rd', 'Colville Rd', 'Hermitage Rd']),
  z('28208', 'CLT', 35.228, -80.908, ['Wilkinson Blvd', 'Freedom Dr', 'Tuckaseegee Rd', 'Ashley Rd', 'Morehead St'], false),
  z('28209', 'CLT', 35.179, -80.853, ['Park Rd', 'Woodlawn Rd', 'Montford Dr', 'Selwyn Ave', 'Hillside Ave']),
  z('28210', 'CLT', 35.131, -80.856, ['Fairview Rd', 'Sharon Rd', 'Park South Dr', 'Carmel Rd', 'Quail Hollow Rd']),
  z('28211', 'CLT', 35.169, -80.796, ['Randolph Rd', 'Sardis Rd', 'Wendover Rd', 'Sharon Amity Rd', 'Providence Rd']),
  z('28217', 'CLT', 35.17, -80.908, ['S Tryon St', 'Westinghouse Blvd', 'Nations Ford Rd', 'Arrowood Rd', 'Yorkmont Rd'], false),
  z('28269', 'CLT', 35.336, -80.798, ['Mallard Creek Rd', 'W Mallard Creek Church Rd', 'Prosperity Church Rd', 'David Cox Rd', 'Eastfield Rd']),
  z('28277', 'CLT', 35.052, -80.817, ['Ballantyne Commons Pkwy', 'Johnston Rd', 'Community House Rd', 'Rea Rd', 'Providence Rd W']),
  // Asheville, NC
  z('28801', 'AVL', 35.596, -82.556, ['Haywood St', 'Lexington Ave', 'Biltmore Ave', 'Patton Ave', 'Broadway St']),
  z('28803', 'AVL', 35.556, -82.518, ['Hendersonville Rd', 'Sweeten Creek Rd', 'Fairview Rd', 'Mills Gap Rd', 'Biltmore Ave']),
  z('28804', 'AVL', 35.637, -82.557, ['Merrimon Ave', 'Beaverdam Rd', 'Kimberly Ave', 'Edgewood Rd', 'Grove St']),
  z('28805', 'AVL', 35.604, -82.493, ['Tunnel Rd', 'Swannanoa River Rd', 'Chunns Cove Rd', 'Kenilworth Rd', 'Fairview Rd']),
  z('28806', 'AVL', 35.582, -82.62, ['Haywood Rd', 'Patton Ave', 'Sand Hill Rd', 'Brevard Rd', 'Louisiana Ave']),
  // Greenville, SC
  z('29601', 'GSP', 34.848, -82.401, ['Main St', 'Augusta St', 'McBee Ave', 'Washington St', 'Academy St']),
  z('29605', 'GSP', 34.8, -82.39, ['Augusta Rd', 'Mauldin Rd', 'Grove Rd', 'Faris Rd', 'Old Augusta Rd']),
  z('29607', 'GSP', 34.827, -82.342, ['Woodruff Rd', 'Haywood Rd', 'Laurens Rd', 'Roper Mountain Rd', 'Halton Rd']),
  z('29609', 'GSP', 34.893, -82.385, ['Wade Hampton Blvd', 'Rutherford Rd', 'N Pleasantburg Dr', 'Stone Ave', 'Summit Dr']),
  z('29615', 'GSP', 34.862, -82.3, ['Pelham Rd', 'E North St', 'Garlington Rd', 'Haywood Rd', 'Woodruff Rd']),
  // Jacksonville, FL
  z('32202', 'JAX', 30.33, -81.656, ['Bay St', 'Laura St', 'Adams St', 'Forsyth St', 'Hogan St']),
  z('32204', 'JAX', 30.317, -81.685, ['Riverside Ave', 'Park St', 'Oak St', 'Post St', 'Herschel St']),
  z('32205', 'JAX', 30.317, -81.73, ['Roosevelt Blvd', 'Edgewood Ave S', 'St Johns Ave', 'Herschel St', 'Blanding Blvd']),
  z('32207', 'JAX', 30.293, -81.64, ['San Marco Blvd', 'Hendricks Ave', 'Atlantic Blvd', 'Philips Hwy', 'Beach Blvd']),
  z('32211', 'JAX', 30.342, -81.59, ['Arlington Rd', 'University Blvd N', 'Merrill Rd', 'Atlantic Blvd', 'Rogero Rd']),
  z('32216', 'JAX', 30.277, -81.581, ['Southside Blvd', 'Beach Blvd', 'University Blvd S', 'Philips Hwy', 'Spring Park Rd']),
  z('32246', 'JAX', 30.293, -81.52, ['Hodges Blvd', 'Beach Blvd', 'Kernan Blvd', 'Atlantic Blvd', 'St Johns Bluff Rd']),
  z('32254', 'JAX', 30.341, -81.736, ['Commonwealth Ave', 'Beaver St W', 'Lane Ave', 'Edgewood Ave W', 'Pickettville Rd'], false),
  z('32256', 'JAX', 30.214, -81.55, ['Baymeadows Rd', 'Southside Blvd', 'Gate Pkwy', 'Deerwood Park Blvd', 'Old St Augustine Rd']),
  // Charleston, SC
  z('29401', 'CHS', 32.779, -79.937, ['King St', 'Meeting St', 'Broad St', 'East Bay St', 'Calhoun St']),
  z('29403', 'CHS', 32.798, -79.949, ['Rutledge Ave', 'Morrison Dr', 'Huger St', 'Spring St', 'Cannon St']),
  z('29407', 'CHS', 32.799, -80.007, ['Savannah Hwy', 'Sam Rittenberg Blvd', 'Ashley River Rd', 'Wappoo Rd', 'Orleans Rd']),
  z('29412', 'CHS', 32.724, -79.954, ['Folly Rd', 'Maybank Hwy', 'Camp Rd', 'Harbor View Rd', 'Riverland Dr']),
  z('29414', 'CHS', 32.817, -80.057, ['Bees Ferry Rd', 'Glenn McConnell Pkwy', 'Ashley River Rd', 'Dorchester Rd', 'Old Towne Rd']),
  z('29492', 'CHS', 32.865, -79.9, ['Seven Farms Dr', 'River Landing Dr', 'Island Park Dr', 'Fairchild St', 'Daniel Island Dr']),
  // Memphis, TN
  z('38103', 'MEM', 35.145, -90.053, ['Main St', 'Front St', 'Union Ave', 'Madison Ave', 'Beale St']),
  z('38104', 'MEM', 35.133, -90.005, ['Union Ave', 'Cooper St', 'Poplar Ave', 'Madison Ave', 'Central Ave']),
  z('38107', 'MEM', 35.175, -90.02, ['N Watkins St', 'Jackson Ave', 'Chelsea Ave', 'Vollintine Ave', 'N Hollywood St']),
  z('38111', 'MEM', 35.111, -89.945, ['Highland St', 'Southern Ave', 'Park Ave', 'Getwell Rd', 'Walker Ave']),
  z('38117', 'MEM', 35.117, -89.905, ['Poplar Ave', 'Mendenhall Rd', 'Park Ave', 'White Station Rd', 'Quince Rd']),
  z('38118', 'MEM', 35.039, -89.93, ['Lamar Ave', 'Getwell Rd', 'Democrat Rd', 'Knight Arnold Rd', 'Perkins Rd'], false),
  z('38119', 'MEM', 35.082, -89.85, ['Kirby Pkwy', 'Ridgeway Rd', 'Poplar Ave', 'Quince Rd', 'Hickory Hill Rd']),
  z('38122', 'MEM', 35.158, -89.92, ['Summer Ave', 'Macon Rd', 'Graham St', 'Waring Rd', 'Highland St']),
  // Knoxville, TN
  z('37902', 'KNX', 35.964, -83.92, ['Gay St', 'Clinch Ave', 'Church Ave', 'Walnut St', 'State St']),
  z('37916', 'KNX', 35.955, -83.933, ['Cumberland Ave', 'Lake Ave', 'Laurel Ave', 'White Ave', '17th St']),
  z('37917', 'KNX', 36.0, -83.912, ['Broadway', 'N Central St', 'Washington Pike', 'Tazewell Pike', 'Fair Dr']),
  z('37918', 'KNX', 36.03, -83.89, ['Washington Pike', 'Millertown Pike', 'Jacksboro Pike', 'Murphy Rd', 'Fountain City Rd']),
  z('37919', 'KNX', 35.924, -84.0, ['Kingston Pike', 'Sutherland Ave', 'Northshore Dr', 'Westland Dr', 'Lyons View Pike']),
  z('37920', 'KNX', 35.92, -83.88, ['Chapman Hwy', 'Moody Ave', 'Young High Pike', 'Maryville Pike', 'Sevier Ave']),
  z('37921', 'KNX', 35.98, -83.99, ['Middlebrook Pike', 'Western Ave', 'Keith Ave', 'Ball Camp Pike', 'Sutherland Ave'], false),
  z('37923', 'KNX', 35.923, -84.088, ['Kingston Pike', 'Cedar Bluff Rd', 'Gleason Dr', 'Morrell Rd', 'Middlebrook Pike']),
  // Chattanooga, TN
  z('37402', 'CHA', 35.047, -85.31, ['Market St', 'Broad St', 'Chestnut St', 'Carter St', 'Walnut St']),
  z('37403', 'CHA', 35.044, -85.295, ['McCallie Ave', 'Houston St', 'E 3rd St', 'Palmetto St', 'Vine St']),
  z('37405', 'CHA', 35.075, -85.32, ['Frazier Ave', 'Manufacturers Rd', 'Hixson Pike', 'Cherokee Blvd', 'Barton Ave']),
  z('37408', 'CHA', 35.03, -85.31, ['Main St', 'Rossville Ave', 'Cowart St', 'E Main St', 'Market St'], false),
  z('37411', 'CHA', 35.025, -85.235, ['Brainerd Rd', 'Moore Rd', 'Belvoir Ave', 'Spring Creek Rd', 'Tunnel Blvd']),
  z('37415', 'CHA', 35.12, -85.28, ['Hixson Pike', 'Dayton Blvd', 'Ashland Ter', 'Hamill Rd', 'Mountain Creek Rd']),
  z('37421', 'CHA', 35.03, -85.15, ['Gunbarrel Rd', 'Shallowford Rd', 'Hamilton Place Blvd', 'Lee Hwy', 'E Brainerd Rd']),
];

export const zipInfo = (zip: string) => ZIPS.find((x) => x.zip === zip)!;

/** Places where losses happen (intersections, interstates), by metro. */
export const LOSS_LOCATIONS: Record<Metro, { line: string; zip: string }[]> = {
  CLT: [
    { line: 'N Tryon St & E Trade St', zip: '28202' }, { line: 'South Blvd & E Woodlawn Rd', zip: '28209' },
    { line: 'Central Ave & The Plaza', zip: '28205' }, { line: 'I-77 S near Tyvola Rd', zip: '28217' },
    { line: 'I-277 near Kings Dr', zip: '28204' }, { line: 'Providence Rd & Queens Rd', zip: '28207' },
    { line: 'Fairview Rd & Sharon Rd', zip: '28210' }, { line: 'N Tryon St & W Mallard Creek Church Rd', zip: '28269' },
    { line: 'Wilkinson Blvd & Ashley Rd', zip: '28208' }, { line: 'Johnston Rd & Ballantyne Commons Pkwy', zip: '28277' },
  ],
  AVL: [
    { line: 'Patton Ave & Haywood Rd', zip: '28806' }, { line: 'I-240 W near Patton Ave', zip: '28806' },
    { line: 'Merrimon Ave & W Chestnut St', zip: '28801' }, { line: 'Tunnel Rd & Swannanoa River Rd', zip: '28805' },
    { line: 'Hendersonville Rd & Fairview Rd', zip: '28803' },
  ],
  GSP: [
    { line: 'Woodruff Rd & Haywood Rd', zip: '29607' }, { line: 'Pelham Rd & Haywood Rd', zip: '29615' },
    { line: 'Main St & Washington St', zip: '29601' }, { line: 'Wade Hampton Blvd & N Pleasantburg Dr', zip: '29609' },
    { line: 'I-385 N near Roper Mountain Rd', zip: '29607' }, { line: 'Augusta St & Faris Rd', zip: '29605' },
  ],
  JAX: [
    { line: 'Beach Blvd & Southside Blvd', zip: '32216' }, { line: 'I-95 S near Baymeadows Rd', zip: '32256' },
    { line: 'Atlantic Blvd & University Blvd N', zip: '32211' }, { line: 'San Marco Blvd & Atlantic Blvd', zip: '32207' },
    { line: 'Roosevelt Blvd & Edgewood Ave S', zip: '32205' }, { line: 'Bay St & Laura St', zip: '32202' },
    { line: 'Hodges Blvd & Beach Blvd', zip: '32246' },
  ],
  CHS: [
    { line: 'King St & Calhoun St', zip: '29401' }, { line: 'Savannah Hwy & Sam Rittenberg Blvd', zip: '29407' },
    { line: 'Folly Rd & Maybank Hwy', zip: '29412' }, { line: 'I-26 E near Rutledge Ave', zip: '29403' },
    { line: 'Glenn McConnell Pkwy & Bees Ferry Rd', zip: '29414' }, { line: 'Seven Farms Dr & River Landing Dr', zip: '29492' },
  ],
  MEM: [
    { line: 'Poplar Ave & Highland St', zip: '38111' }, { line: 'I-240 near Poplar Ave', zip: '38117' },
    { line: 'Union Ave & Cooper St', zip: '38104' }, { line: 'Summer Ave & Highland St', zip: '38122' },
    { line: 'Lamar Ave & Getwell Rd', zip: '38118' }, { line: 'Kirby Pkwy & Poplar Ave', zip: '38119' },
    { line: 'Front St & Beale St', zip: '38103' },
  ],
  KNX: [
    { line: 'Kingston Pike & Northshore Dr', zip: '37919' }, { line: 'I-40 E near Cedar Bluff Rd', zip: '37923' },
    { line: 'Cumberland Ave & 17th St', zip: '37916' }, { line: 'Chapman Hwy & Moody Ave', zip: '37920' },
    { line: 'Broadway & N Central St', zip: '37917' }, { line: 'Washington Pike & Millertown Pike', zip: '37918' },
  ],
  CHA: [
    { line: 'Market St & M L King Blvd', zip: '37402' }, { line: 'Brainerd Rd & Moore Rd', zip: '37411' },
    { line: 'Gunbarrel Rd & Shallowford Rd', zip: '37421' }, { line: 'Frazier Ave & Tremont St', zip: '37405' },
    { line: 'I-24 E near Rossville Blvd', zip: '37408' }, { line: 'Hixson Pike & Hamill Rd', zip: '37415' },
  ],
};

/** Local police agency by city, and the state patrol that works interstate crashes. */
export const POLICE: Record<string, string> = {
  Charlotte: 'CMPD', Asheville: 'APD', Greenville: 'GPD', Jacksonville: 'JSO', Charleston: 'CPD', Memphis: 'MPD', Knoxville: 'KPD', Chattanooga: 'CPD',
};
export const STATE_PATROL: Record<string, string> = { NC: 'NCSHP', SC: 'SCHP', FL: 'FHP', TN: 'THP' };

/** Name pools grouped by heritage so given names and surnames pair plausibly (with some mixing). */
export const NAME_GROUPS: { f: string[]; m: string[]; last: string[]; lang?: [string, number] }[] = [
  { f: ['Emily', 'Sarah', 'Megan', 'Lauren', 'Kristen', 'Rachel', 'Hannah', 'Olivia', 'Grace', 'Chloe', 'Jennifer', 'Laura', 'Natalie', 'Danielle', 'Leah'],
    m: ['James', 'Michael', 'Daniel', 'Ethan', 'Noah', 'Brian', 'Thomas', 'Ryan', 'Tyler', 'Patrick', 'Robert', 'Eric', 'Sean', 'Benjamin', 'Gregory', 'Aaron', 'Joshua'],
    last: ['Johnson', 'Williams', 'Thompson', 'Brown', 'Davis', 'Wilson', 'Anderson', 'Clark', 'Lewis', 'Walker', 'Young', 'Allen', 'Wright', 'Scott', 'Hill',
      'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Campbell', 'Parker', 'Evans', 'Collins', 'Stewart', 'Murphy', 'Cooper',
      'Peterson', 'Sullivan', "O'Brien", 'Kowalski', 'Novak', 'Schmidt', 'Fischer', 'Rossi', 'Dubois', 'Hughes', 'Caldwell', 'Pruitt',
      'McAllister', 'Whitaker', 'Bradley', 'Henderson', 'Lawson', 'Pickens', 'Rutledge'] },
  { f: ['Lucia', 'Ana', 'Camila', 'Isabel', 'Rosa', 'Valeria', 'Gabriela', 'Teresa', 'Marisela', 'Daniela'],
    m: ['Carlos', 'Luis', 'Javier', 'Diego', 'Rafael', 'Alejandro', 'Victor', 'Miguel', 'Jorge', 'Andres'],
    last: ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Flores', 'Torres', 'Perez', 'Reyes', 'Cruz', 'Gutierrez', 'Ortiz', 'Castillo', 'Morales',
      'Delgado', 'Romero', 'Alvarez', 'Jimenez', 'Ruiz', 'Herrera', 'Medina', 'Aguilar', 'Vargas', 'Silva', 'Santos'], lang: ['es', 0.35] },
  { f: ['Mei', 'Lin', 'Xiaoyu', 'Jia', 'Wen'], m: ['Wei', 'Jun', 'Hao', 'Kevin', 'Andrew'], last: ['Chen', 'Wong', 'Liu', 'Huang', 'Zhang', 'Lee'], lang: ['zh', 0.3] },
  { f: ['Thuy', 'Linh', 'Trang', 'Mai'], m: ['Minh', 'Duc', 'Tuan', 'Bao'], last: ['Nguyen', 'Tran', 'Pham', 'Le', 'Vu'], lang: ['vi', 0.3] },
  { f: ['Min-jung', 'Ji-woo', 'Soo-ah'], m: ['Joon', 'Hyun', 'Daniel'], last: ['Kim', 'Park', 'Choi', 'Jung'], lang: ['ko', 0.25] },
  { f: ['Yuki', 'Aiko', 'Haruka'], m: ['Hiroshi', 'Kenji', 'Takeshi'], last: ['Tanaka', 'Yamamoto', 'Sato', 'Nakamura'], lang: ['ja', 0.2] },
  { f: ['Priyanka', 'Ananya', 'Divya', 'Kavya'], m: ['Arjun', 'Ravi', 'Rohan', 'Vikram'], last: ['Patel', 'Singh', 'Shah', 'Gupta', 'Mehta', 'Iyer', 'Rao'] },
  { f: ['Aisha', 'Keisha', 'Monique', 'Jasmine', 'Amara', 'Tamika', 'Brianna', 'Ebony'], m: ['Jamal', 'Marcus', 'Andre', 'Malik', 'Kwame', 'Darnell', 'Terrence', 'Cedric'], last: ['Okafor', 'Mensah', 'Abebe', 'Robinson', 'Jackson', 'Washington', 'Brooks', 'Coleman', 'Harris', 'Bryant', 'Jenkins', 'Simmons', 'Gaines', 'Holloway'] },
  { f: ['Ingrid', 'Siobhan', 'Esther', 'Nicole'], m: ['Samuel', 'Jonah', 'Omar', 'David'], last: ['Jensen', 'Larsen', 'Olsen', 'Lindgren', 'Bjornson', 'Haddad', 'Ahmed', 'Khan'] },
];

/** Map surnames to a preferred language for communication preferences. */
export const LANGUAGE_BY_LAST: Record<string, [string, number]> = Object.fromEntries(
  NAME_GROUPS.flatMap((g) => (g.lang ? g.last.map((l) => [l, g.lang!] as [string, [string, number]]) : [])),
);


export type VehicleKind = 'car' | 'truck' | 'moto' | 'classic' | 'commercial';

export interface CatalogVehicle {
  make: string;
  model: string;
  trims: string[];
  wmi: string;
  years: [number, number];
  msrp: number;
  kind: VehicleKind;
}

const v = (make: string, model: string, trims: string[], wmi: string, years: [number, number], msrp: number, kind: VehicleKind = 'car'): CatalogVehicle =>
  ({ make, model, trims, wmi, years, msrp, kind });

export const VEHICLES: CatalogVehicle[] = [
  v('Honda', 'Accord', ['LX', 'Sport', 'EX-L', 'Touring'], '1HG', [2013, 2026], 30000),
  v('Honda', 'Civic', ['LX', 'Sport', 'EX', 'Si'], '2HG', [2012, 2026], 25000),
  v('Honda', 'CR-V', ['LX', 'EX', 'EX-L', 'Sport Hybrid'], '5J6', [2012, 2026], 32000),
  v('Toyota', 'Camry', ['LE', 'SE', 'XLE', 'XSE'], '4T1', [2012, 2026], 29000),
  v('Toyota', 'Corolla', ['L', 'LE', 'SE', 'XSE'], '5YF', [2012, 2026], 23000),
  v('Toyota', 'RAV4', ['LE', 'XLE', 'XLE Premium', 'Hybrid XSE'], '2T3', [2013, 2026], 32000),
  v('Toyota', 'Prius', ['L Eco', 'LE', 'XLE', 'Limited'], 'JTD', [2010, 2026], 28000),
  v('Toyota', 'Tacoma', ['SR', 'SR5', 'TRD Off-Road', 'TRD Sport'], '3TM', [2012, 2026], 36000, 'truck'),
  v('Tesla', 'Model 3', ['Standard Range', 'Long Range', 'Performance'], '5YJ', [2018, 2026], 45000),
  v('Tesla', 'Model Y', ['Long Range', 'Performance'], '7SA', [2020, 2026], 50000),
  v('Ford', 'F-150', ['XL', 'XLT', 'Lariat', 'King Ranch'], '1FT', [2012, 2026], 45000, 'truck'),
  v('Ford', 'Escape', ['S', 'SE', 'Titanium'], '1FM', [2013, 2026], 28000),
  v('Ford', 'Mustang', ['EcoBoost', 'GT', 'Mach 1'], '1FA', [2012, 2026], 35000),
  v('Chevrolet', 'Bolt EV', ['LT', 'Premier'], '1G1', [2017, 2023], 32000),
  v('Chevrolet', 'Silverado 1500', ['WT', 'LT', 'RST', 'LTZ'], '1GC', [2012, 2026], 44000, 'truck'),
  v('Chevrolet', 'Equinox', ['LS', 'LT', 'Premier'], '2GN', [2012, 2026], 28000),
  v('Subaru', 'Outback', ['Base', 'Premium', 'Limited', 'Onyx Edition XT'], '4S4', [2012, 2026], 32000),
  v('Subaru', 'Forester', ['Base', 'Premium', 'Sport', 'Touring'], 'JF2', [2012, 2026], 30000),
  v('Subaru', 'Crosstrek', ['Base', 'Premium', 'Sport'], 'JF2', [2013, 2026], 26000),
  v('Nissan', 'Altima', ['S', 'SV', 'SR', 'SL'], '1N4', [2012, 2026], 27000),
  v('Nissan', 'Leaf', ['S', 'SV', 'SV Plus'], '1N4', [2013, 2025], 30000),
  v('Nissan', 'Rogue', ['S', 'SV', 'SL', 'Platinum'], '5N1', [2012, 2026], 29000),
  v('Hyundai', 'Elantra', ['SE', 'SEL', 'Limited'], '5NP', [2012, 2026], 22000),
  v('Hyundai', 'Tucson', ['SE', 'SEL', 'Limited'], 'KM8', [2013, 2026], 29000),
  v('Hyundai', 'Ioniq 5', ['SE', 'SEL', 'Limited'], 'KM8', [2022, 2026], 46000),
  v('Kia', 'Sorento', ['LX', 'S', 'EX', 'SX'], '5XY', [2014, 2026], 33000),
  v('Kia', 'Soul', ['LX', 'S', 'GT-Line'], 'KND', [2012, 2025], 21000),
  v('Mazda', 'Mazda3', ['Base', 'Select', 'Preferred', 'Premium'], 'JM1', [2012, 2026], 24000),
  v('Mazda', 'CX-5', ['Sport', 'Touring', 'Grand Touring', 'Carbon Edition'], 'JM3', [2013, 2026], 30000),
  v('Volkswagen', 'Jetta', ['S', 'SE', 'SEL'], '3VW', [2012, 2026], 23000),
  v('Volkswagen', 'Golf GTI', ['S', 'SE', 'Autobahn'], '3VW', [2015, 2024], 31000),
  v('BMW', '3 Series', ['330i', '330i xDrive', 'M340i'], 'WBA', [2012, 2026], 46000),
  v('Mercedes-Benz', 'C-Class', ['C 300', 'C 300 4MATIC'], 'W1K', [2015, 2026], 47000),
  v('Lexus', 'RX', ['RX 350', 'RX 350 F Sport', 'RX 450h'], '2T2', [2012, 2026], 50000),
  v('Jeep', 'Wrangler', ['Sport', 'Sahara', 'Rubicon'], '1C4', [2012, 2026], 38000),
  v('Jeep', 'Grand Cherokee', ['Laredo', 'Limited', 'Overland'], '1C4', [2012, 2026], 42000),
  v('Ram', '1500', ['Tradesman', 'Big Horn', 'Laramie'], '1C6', [2012, 2026], 44000, 'truck'),
  v('Volvo', 'XC60', ['Momentum', 'Inscription', 'R-Design', 'Ultimate'], 'YV4', [2014, 2026], 47000),
  v('Rivian', 'R1S', ['Adventure', 'Dual-Motor'], '7PD', [2022, 2026], 80000),
  v('Audi', 'Q5', ['Premium', 'Premium Plus', 'Prestige'], 'WA1', [2013, 2026], 46000),

  v('Ford', 'Transit-250', ['Cargo Van'], '1FT', [2016, 2025], 46000, 'commercial'),
  v('Ford', 'F-250 Super Duty', ['XL', 'XLT'], '1FT', [2015, 2025], 48000, 'commercial'),
  v('Ram', 'ProMaster 2500', ['Cargo Van High Roof'], '3C6', [2016, 2025], 44000, 'commercial'),

  v('Harley-Davidson', 'Street Glide', ['Special'], '1HD', [2014, 2026], 27000, 'moto'),
  v('Honda', 'Rebel 500', ['Base', 'ABS'], 'JH2', [2017, 2026], 6500, 'moto'),
  v('Yamaha', 'MT-07', ['Base'], 'JYA', [2015, 2026], 8000, 'moto'),
  v('Kawasaki', 'Ninja 400', ['ABS'], 'JKA', [2018, 2026], 5500, 'moto'),
  v('Ducati', 'Monster', ['Plus'], 'ZDM', [2015, 2026], 12500, 'moto'),
  v('BMW', 'R 1250 GS', ['Adventure'], 'WB1', [2019, 2024], 19000, 'moto'),
  v('Triumph', 'Bonneville T120', ['Black'], 'SMT', [2016, 2026], 12500, 'moto'),

  v('Porsche', '911', ['Carrera'], 'WP0', [1987, 1989], 85000, 'classic'),
  v('Ford', 'Mustang', ['GT'], '1FA', [1985, 1993], 22000, 'classic'),
  v('Toyota', 'Land Cruiser', ['FJ62'], 'JT3', [1988, 1990], 45000, 'classic'),
  v('Mazda', 'MX-5 Miata', ['Base'], 'JM1', [1990, 1993], 14000, 'classic'),
  v('Chevrolet', 'Corvette', ['Z51'], '1G1', [1984, 1989], 18000, 'classic'),
  v('Buick', 'Regal', ['Grand National'], '1G4', [1986, 1987], 48000, 'classic'),
  v('BMW', 'M3', ['E30'], 'WBS', [1988, 1991], 95000, 'classic'),
  v('Mercedes-Benz', '560SL', ['Roadster'], 'WDB', [1986, 1989], 38000, 'classic'),
];

export const COLORS: [string, number][] = [
  ['White', 22], ['Black', 18], ['Gray', 16], ['Silver', 12], ['Blue', 10], ['Red', 8], ['Pearl White', 4], ['Midnight Blue', 3],
  ['Green', 3], ['Charcoal', 2], ['Beige', 1], ['Burgundy', 1], ['Orange', 1],
];

export interface VendorSeed {
  id: string;
  name: string;
  type: 'repair' | 'tow' | 'rental' | 'glass' | 'appraisal';
  line1: string;
  zip: string;
  inNetwork: boolean;
  rating?: number;
  phone: string;
  email: string;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  createdAt: string;
  serviceArea?: string[];
  taxId: string;
}

type V = [id: string, name: string, type: VendorSeed['type'], line1: string, zip: string, rating: number | undefined, phone: string, domain: string, createdAt: string, extra?: Partial<VendorSeed>];

/** EIN campus prefixes by state, so tax IDs look regionally plausible. */
const EIN_PREFIX: Record<string, string> = { '28': '56', '29': '57', '32': '59', '37': '62', '38': '62' };
const mailbox: Record<VendorSeed['type'], string> = { repair: 'estimates', tow: 'dispatch', rental: 'reservations', glass: 'service', appraisal: 'assignments' };

const vendor = ([id, name, type, line1, zip, rating, phone, domain, createdAt, extra]: V): VendorSeed => ({
  id, name, type, line1, zip, inNetwork: true, rating, phone, email: `${mailbox[type]}@${domain}.example.com`, status: 'active', createdAt,
  taxId: `${EIN_PREFIX[zip.slice(0, 2)]}-${id.slice(4)}${zip.slice(2)}`, ...extra,
});

export const VENDORS: VendorSeed[] = ([
  // Charlotte, NC (headquarters market)
  ['ven_4417', 'Bayview Collision & Auto Body', 'repair', '1215 S Tryon St', '28203', 4.8, '+17045550199', 'bayviewcollision', '2022-01-18T09:00:00Z', { serviceArea: ['28202', '28203', '28204'] }],
  ['ven_4502', 'Embarcadero Auto Works', 'repair', '425 W Trade St', '28202', 4.6, '+17045550123', 'embarcaderoautoworks', '2021-06-02T17:30:00Z'],
  ['ven_4128', 'Queen City Body & Paint', 'repair', '3100 N Davidson St', '28206', 4.5, '+17045550161', 'queencitybodypaint', '2020-03-09T16:00:00Z'],
  ['ven_4236', 'SouthPark Collision Center', 'repair', '4500 Park Rd', '28209', 4.4, '+17045550174', 'southparkcollision', '2019-09-23T18:10:00Z'],
  ['ven_4733', 'Freedom Drive Auto Body', 'repair', '2800 Freedom Dr', '28208', 4.1, '+17045550147', 'freedomdriveautobody', '2023-03-30T20:00:00Z', { inNetwork: false }],
  ['ven_4720', 'Plaza Midwood Body Works', 'repair', '1500 Central Ave', '28205', 3.9, '+17045550185', 'plazamidwoodbody', '2021-04-27T18:00:00Z', { inNetwork: false, status: 'suspended' }],
  ['ven_4301', 'Carolina Towing & Recovery', 'tow', '2300 Wilkinson Blvd', '28208', 4.5, '+17045550108', 'carolinatowing', '2019-05-14T15:00:00Z'],
  ['ven_4350', 'Uptown Car Rental', 'rental', '201 S College St', '28202', 4.3, '+17045550133', 'uptowncarrental', '2020-01-21T17:15:00Z'],
  ['ven_4377', 'Piedmont Mobile Auto Glass', 'glass', '5600 South Blvd', '28217', 4.7, '+17045550192', 'piedmontglass', '2019-12-02T18:30:00Z'],
  ['ven_4390', 'Queen City Auto Appraisers', 'appraisal', '1001 Morehead Square Dr', '28203', 4.6, '+17045550156', 'qcappraisers', '2019-03-18T16:00:00Z'],
  ['ven_4395', 'Carolinas Vehicle Appraisal Group', 'appraisal', '9300 Harris Corners Pkwy', '28269', undefined, '+19805550143', 'carolinasappraisal', '2026-10-06T21:12:00Z', { inNetwork: false, status: 'pending' }],
  // Asheville, NC
  ['ven_4611', 'Blue Ridge Collision', 'repair', '1200 Patton Ave', '28806', 4.7, '+18285550138', 'blueridgecollision', '2020-11-12T19:45:00Z'],
  ['ven_4655', 'Biltmore Auto Body', 'repair', '1800 Hendersonville Rd', '28803', 4.6, '+18285550117', 'biltmoreautobody', '2021-02-04T17:00:00Z'],
  ['ven_4318', 'Mountain Area Towing', 'tow', '150 Sand Hill Rd', '28806', 4.3, '+18285550129', 'mountainareatowing', '2020-07-01T15:30:00Z'],
  ['ven_4362', 'Asheville Car Rental', 'rental', '220 Tunnel Rd', '28805', 4.1, '+18285550171', 'ashevillecarrental', '2022-05-09T16:00:00Z'],
  ['ven_4381', 'Blue Ridge Glass Express', 'glass', '900 Merrimon Ave', '28804', 4.5, '+18285550114', 'blueridgeglass', '2021-08-11T17:40:00Z'],
  ['ven_4386', 'Mountain Appraisal Services', 'appraisal', '25 Broadway St', '28801', 4.4, '+18285550152', 'mountainappraisal', '2021-03-02T16:00:00Z'],
  // Greenville, SC
  ['ven_4689', 'Upstate Auto Body & Frame', 'repair', '2100 Laurens Rd', '29607', 4.3, '+18645550152', 'upstateframe', '2022-08-15T16:20:00Z'],
  ['ven_4692', 'Augusta Road Collision', 'repair', '2400 Augusta St', '29605', 4.6, '+18645550126', 'augustaroadcollision', '2020-04-20T16:00:00Z'],
  ['ven_4327', 'Upstate Tow & Transport', 'tow', '1500 Rutherford Rd', '29609', 4.4, '+18645550166', 'upstatetow', '2021-10-19T16:45:00Z'],
  ['ven_4366', 'Greenville Car Rental', 'rental', '1025 Woodruff Rd', '29607', 4.2, '+18645550139', 'greenvillecarrental', '2022-02-14T17:00:00Z'],
  ['ven_4383', 'Palmetto Auto Glass', 'glass', '3700 Pelham Rd', '29615', 4.6, '+18645550194', 'palmettoautoglass', '2020-10-05T16:40:00Z'],
  ['ven_4388', 'Upstate Claims Appraisal', 'appraisal', '101 N Main St', '29601', 4.5, '+18645550168', 'upstateappraisal', '2019-11-11T17:00:00Z'],
  // Jacksonville, FL
  ['ven_4801', 'First Coast Collision Center', 'repair', '5000 Beach Blvd', '32207', 4.7, '+19045550126', 'firstcoastcollision', '2019-07-08T17:00:00Z'],
  ['ven_4815', 'Riverside Auto Body', 'repair', '1900 Park St', '32204', 4.5, '+19045550149', 'riversideautobody', '2020-02-26T18:20:00Z'],
  ['ven_4822', 'Southside Pro Collision', 'repair', '8800 Baymeadows Rd', '32256', 4.6, '+19045550131', 'southsideprocollision', '2021-01-12T19:00:00Z'],
  ['ven_4853', 'Westside Body Shop', 'repair', '5200 Commonwealth Ave', '32254', 3.8, '+19045550177', 'westsidebodyshop', '2023-06-05T18:00:00Z', { inNetwork: false }],
  ['ven_4861', 'First Coast Towing & Recovery', 'tow', '2400 Beaver St W', '32254', 4.4, '+19045550102', 'firstcoasttowing', '2019-04-02T15:00:00Z'],
  ['ven_4877', 'JAX Area Car Rental', 'rental', '9900 Southside Blvd', '32256', 4.2, '+19045550153', 'jaxarearental', '2020-06-22T17:30:00Z'],
  ['ven_4891', 'Sunshine Mobile Auto Glass', 'glass', '4500 Philips Hwy', '32207', 4.6, '+19045550194', 'sunshinemobileglass', '2020-10-05T16:40:00Z'],
  ['ven_4897', 'Crosstown Appraisal Services', 'appraisal', '200 W Forsyth St', '32202', 4.5, '+19045550168', 'crosstownappraisal', '2019-11-11T17:00:00Z'],
  // Charleston, SC
  ['ven_4838', 'Lowcountry Precision Auto Body', 'repair', '1700 Savannah Hwy', '29407', 4.8, '+18435550118', 'lowcountryprecision', '2020-09-30T16:30:00Z'],
  ['ven_4846', 'Harbor City Collision', 'repair', '1900 Folly Rd', '29412', 4.2, '+18435550164', 'harborcitycollision', '2022-04-18T17:10:00Z'],
  ['ven_4870', 'Lowcountry Towing', 'tow', '1100 Morrison Dr', '29403', 4.1, '+18435550186', 'lowcountrytowing', '2021-03-15T16:00:00Z'],
  ['ven_4884', 'Charleston Car Rental', 'rental', '375 Meeting St', '29403', 4.0, '+18435550139', 'charlestoncarrental', '2022-01-10T18:00:00Z'],
  ['ven_4893', 'Coastal Auto Glass', 'glass', '1600 Sam Rittenberg Blvd', '29407', 4.5, '+18435550121', 'coastalautoglass', '2020-08-17T16:00:00Z'],
  ['ven_4899', 'Palmetto Claims Appraisal', 'appraisal', '40 Calhoun St', '29401', 4.4, '+18435550145', 'palmettoappraisal', '2021-05-24T16:00:00Z'],
  // Memphis, TN
  ['ven_4910', 'Bluff City Collision Center', 'repair', '3400 Summer Ave', '38122', 4.7, '+19015550121', 'bluffcitycollision', '2020-05-04T17:00:00Z'],
  ['ven_4918', 'Midtown Auto Body', 'repair', '1800 Union Ave', '38104', 4.4, '+19015550145', 'midtownautobody', '2021-07-19T16:00:00Z'],
  ['ven_4926', 'East Memphis Precision Collision', 'repair', '4700 Poplar Ave', '38117', 4.6, '+19015550113', 'eastmemphisprecision', '2019-10-28T17:30:00Z'],
  ['ven_4933', 'Mid-South Towing', 'tow', '3800 Lamar Ave', '38118', 4.3, '+19015550158', 'midsouthtowing', '2019-08-13T15:00:00Z'],
  ['ven_4941', 'Memphis Car Rental', 'rental', '100 N Main St', '38103', 4.1, '+19015550172', 'memphiscarrental', '2021-09-07T16:30:00Z'],
  ['ven_4948', 'River City Auto Glass', 'glass', '3000 Getwell Rd', '38118', 4.5, '+19015550136', 'rivercityautoglass', '2020-03-16T17:00:00Z'],
  ['ven_4955', 'Mid-South Claims Appraisal', 'appraisal', '6000 Poplar Ave', '38119', 4.6, '+19015550189', 'midsouthappraisal', '2019-06-24T16:00:00Z'],
  ['ven_4962', 'Lamar Avenue Body Works', 'repair', '4200 Lamar Ave', '38118', 3.5, '+19015550167', 'lamaravebodyworks', '2020-12-01T18:00:00Z', { inNetwork: false, status: 'terminated' }],
  // Knoxville, TN
  ['ven_4971', 'Smoky Mountain Collision', 'repair', '5800 Kingston Pike', '37919', 4.7, '+18655550124', 'smokymountaincollision', '2020-06-15T16:00:00Z'],
  ['ven_4974', 'Old City Auto Body', 'repair', '800 N Central St', '37917', 4.5, '+18655550137', 'oldcityautobody', '2021-11-08T17:00:00Z'],
  ['ven_4977', 'Volunteer Towing & Recovery', 'tow', '2600 Middlebrook Pike', '37921', 4.4, '+18655550109', 'volunteertowing', '2019-09-03T15:00:00Z'],
  ['ven_4980', 'Knoxville Car Rental', 'rental', '9100 Kingston Pike', '37923', 4.2, '+18655550150', 'knoxvillecarrental', '2022-03-21T16:00:00Z'],
  ['ven_4983', 'East Tennessee Auto Glass', 'glass', '4600 Chapman Hwy', '37920', 4.6, '+18655550182', 'easttnautoglass', '2020-12-14T17:00:00Z'],
  ['ven_4986', 'Volunteer State Appraisal', 'appraisal', '600 Gay St', '37902', 4.5, '+18655550163', 'volstateappraisal', '2019-05-20T16:00:00Z'],
  // Chattanooga, TN
  ['ven_4989', 'Scenic City Collision', 'repair', '1400 Rossville Ave', '37408', 4.7, '+14235550127', 'sceniccitycollision', '2020-08-03T16:00:00Z'],
  ['ven_4991', 'Brainerd Auto Body', 'repair', '4500 Brainerd Rd', '37411', 4.5, '+14235550141', 'brainerdautobody', '2021-06-28T17:00:00Z'],
  ['ven_4993', 'Lookout Towing', 'tow', '1800 E Main St', '37408', 4.3, '+14235550104', 'lookouttowing', '2019-10-07T15:00:00Z'],
  ['ven_4995', 'Chattanooga Car Rental', 'rental', '2100 Hamilton Place Blvd', '37421', 4.1, '+14235550159', 'chattanoogacarrental', '2022-07-11T16:00:00Z'],
  ['ven_4997', 'Tennessee Valley Auto Glass', 'glass', '5200 Hixson Pike', '37415', 4.5, '+14235550176', 'tnvalleyautoglass', '2020-04-13T17:00:00Z'],
  ['ven_4999', 'Scenic City Appraisal Services', 'appraisal', '701 Market St', '37402', 4.6, '+14235550188', 'sceniccityappraisal', '2019-07-29T16:00:00Z'],
] as V[]).map(vendor);

/** Service radius by vendor type (miles); repair shops serve their part of town, others the metro. */
export const SERVICE_RADIUS: Record<VendorSeed['type'], number> = { repair: 6, tow: 40, rental: 25, glass: 40, appraisal: 45 };

export const ADJUSTERS = [
  { id: 'adj_105', first_name: 'Denise', last_name: 'Okafor', email: 'denise.okafor@vandelay-industries.example', title: 'Claims Supervisor', metro: 'CLT' },
  { id: 'adj_220', first_name: 'Priya', last_name: 'Raman', email: 'priya.raman@vandelay-industries.example', title: 'Senior Claims Adjuster', metro: 'CLT' },
  { id: 'adj_231', first_name: 'Marcus', last_name: 'Bell', email: 'marcus.bell@vandelay-industries.example', title: 'Claims Adjuster', metro: 'AVL,GSP' },
  { id: 'adj_118', first_name: 'Elena', last_name: 'Castillo', email: 'elena.castillo@vandelay-industries.example', title: 'Senior Claims Adjuster', metro: 'JAX' },
  { id: 'adj_244', first_name: 'Kevin', last_name: 'Tran', email: 'kevin.tran@vandelay-industries.example', title: 'Claims Adjuster', metro: 'CHS' },
  { id: 'adj_207', first_name: 'Hannah', last_name: 'Lindqvist', email: 'hannah.lindqvist@vandelay-industries.example', title: 'Claims Adjuster', metro: 'MEM' },
  { id: 'adj_252', first_name: 'Caleb', last_name: 'Whitfield', email: 'caleb.whitfield@vandelay-industries.example', title: 'Claims Adjuster', metro: 'KNX,CHA' },
];

export const ADJUSTERS_BY_METRO: Record<Metro, string[]> = {
  CLT: ['adj_220'], AVL: ['adj_231'], GSP: ['adj_231'], JAX: ['adj_118'], CHS: ['adj_244'], MEM: ['adj_207'], KNX: ['adj_252'], CHA: ['adj_252'],
};
export const SUPERVISOR = 'adj_105';
export const AGENT_ID = 'agt_claims_assistant';
