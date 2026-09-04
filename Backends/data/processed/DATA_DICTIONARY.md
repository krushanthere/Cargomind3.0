# CargoMind 3.0 — North Eastern Region (NER) Open Data Dictionary

This document details the real Indian open datasets ingested, cleaned, and integrated into the CargoMind 3.0 last-mile logistics orchestration and cold-chain risk platform for Smart India Hackathon (SIH 2026 - Problem SIH26002).

---

## 1. Datasets Overview

| Dataset Identifier | Primary Source | Coverage | Format Ingested | Processed Records | Key Routing & Risk Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Census 2011 Primary Census Abstract (PCA)** | Office of the Registrar General & Census Commissioner of India ([censusindia.gov.in](https://censusindia.gov.in)) | 8 NER States (AR, AS, MN, ML, MZ, NL, SK, TR) | Excel BIFF8 (.xls) | **3,379** settlements (3,197 Villages, 162 CD Blocks, 20 Towns) | Farmer & cultivator density, agricultural output tonnage estimation, essential inbound freight demand proxy, rural vulnerability scoring. |
| **PMGSY GeoSadak Habitations** | Ministry of Rural Development ([geosadak-pmgsy.nic.in](https://geosadak-pmgsy.nic.in/opendata/)) | 8 NER States (AS, AR, MN, ML, MZ, NL, SK, TR) | Shapefile (.shp/.dbf) | **66,899** village points | Core VRP demand nodes, population density, community pickup locations. |
| **PMGSY GeoSadak Rural Roads** | Ministry of Rural Development | 8 NER States | Shapefile (.shp/.dbf) | **45,870** road polylines | Rural road network, surface roughness (IRI), width constraints, ownership. |
| **NASA/USGS SRTM 30m DEM** | USGS EarthExplorer / OpenTopography | 38 1-arc-second tiles | GeoTIFF (.tif) | **100% NER Topography** | Digital Elevation Model (DEM), route gradient %, hilliness penalties, gradeability check. |
| **GatiShakti Railway Network** | Ministry of Railways / BISAG-N | Northeast Frontier Railway (NFR) | GeoJSONL (.7z) | **1,127** stations, **293** tracks | Multi-modal rail sidings, intermodal transfers, low-carbon bulk rail corridors. |

---

## 2. Field Specifications & Definitions

### A. Census 2011 Primary Census Abstract (`ner_census_settlements.json` & `ner_census_pca_summary.json`)
- `state` *(String)*: NER state name (`Arunachal Pradesh`, `Assam`, `Manipur`, `Meghalaya`, `Mizoram`, `Nagaland`, `Sikkim`, `Tripura`).
- `state_code` *(String)*: 2-letter state code (`AR`, `AS`, `MN`, `ML`, `MZ`, `NL`, `SK`, `TR`).
- `district` *(String)*: District name (e.g., `Tawang`, `Kokrajhar`, `Senapati`, `Ribhoi`, `Mokokchung`, `North District`, `West Tripura`, `Mamit`).
- `level` *(String)*: Administrative hierarchy (`VILLAGE`, `CD BLOCK`, `TOWN`).
- `name` *(String)*: Settlement or administrative unit name.
- `area_type` *(String)*: Classification (`Rural`, `Urban`, `Total`).
- `households` *(Integer)*: Number of residential households.
- `total_population` *(Integer)*: Total resident population.
- `male_population` / `female_population` *(Integer)*: Gender distribution.
- `child_0_6_population` *(Integer)*: Population in age group 0–6 (used to estimate pediatric vaccine & cold-chain medical requirements).
- `sc_population` / `st_population` *(Integer)*: Scheduled Castes & Scheduled Tribes population.
- `literates_population` *(Integer)*: Total literate persons count.
- `literacy_rate_pct` *(Float)*: Percentage literacy rate.
- `total_workers` *(Integer)*: Total workforce in the settlement.
- `main_cultivators` *(Integer)*: Number of full-time farmers/cultivators producing agricultural goods.
- `main_agri_labourers` *(Integer)*: Agricultural workforce capacity.
- `main_household_industry` *(Integer)*: Cottage and artisan industry workforce.
- `main_other_workers` *(Integer)*: Service, commercial, and trade workforce.
- `marginal_workers` *(Integer)*: Seasonal / marginal workforce count.
- `cultivator_ratio_pct` *(Float)*: Cultivator percentage out of total workforce.
- `agri_workforce_pct` *(Float)*: Combined agrarian worker percentage.
- `logistics_metrics`:
  - `daily_agri_produce_kg` *(Float)*: Estimated outbound agricultural freight output (kg/day).
  - `daily_agri_produce_tons` *(Float)*: Estimated outbound agricultural freight output (tonnes/day).
  - `daily_inbound_freight_kg` *(Float)*: Inbound essential commodity & FMCG throughput (kg/day).
  - `daily_inbound_freight_tons` *(Float)*: Inbound essential commodity & FMCG throughput (tonnes/day).
  - `coldchain_pharma_demand_units` *(Float)*: Priority cold-chain pharmaceutical units required.
  - `recommended_pickup_vehicle` *(String)*: Recommended fleet vehicle category (`mini_truck`, `pickup_4x4`, `heavy_truck`).

### B. Habitations Layer (`ner_habitations_summary.json` & `ner_habitations_sampled.json`)
- `id` *(String)*: Unique PMGSY Habitation Identification Code (e.g., `1323169`, `428432`).
- `name` *(String)*: Official name of the village/habitation.
- `state` *(String)*: NER State name (`Assam`, `ArunachalPradesh`, `Manipur`, `Meghalaya`, `Mizoram`, `Nagaland`, `Sikkim`, `Tripura`).
- `state_code` *(String)*: 2-letter ISO/RTO state abbreviation (`AS`, `AR`, `MN`, `ML`, `MZ`, `NL`, `SK`, `TR`).
- `district_id` *(Integer)*: Local Government Directory (LGD) district identifier.
- `block_id` *(Integer)*: PMGSY administrative block identifier.
- `population` *(Integer)*: Total resident population count.
- `estimated_weekly_demand_kg` *(Float)*: Estimated freight/essential commodity throughput (proxy: $1.25 \times \text{population}$).
- `lat` / `lon` *(Float)*: Geographic coordinates in WGS-84 (EPSG:4326).
- `elevation_m` *(Float)*: Exact SRTM 30m ASL elevation in meters.
- `terrain_type` *(String)*: Terrain classification (`plains` < 200m, `hilly` 200–1000m, `mountainous` >= 1000m).

### C. Road Network Layer (`ner_roads.geojson`)
- `id` *(String)*: PMGSY Existing Road (ER) ID or National Highway vector ID.
- `name` *(String)*: Gazette road name or connecting corridor.
- `category` *(String)*: Functional classification (`NH`: National Highway, `SH`: State Highway, `MDR`: Major District Road, `RR(VR)`: Rural Village Road).
- `length_km` *(Float)*: Total centerline distance in kilometers.
- `surface_type` *(String)*: Road surface classification (`asphalt`, `paved`, `gravel`, `unpaved`).
- `base_iri` *(Float)*: International Roughness Index in m/km (2.0 = smooth highway, 8.5+ = degraded dirt track).
- `static_base_score` *(Float)*: Static roadability score on a 0–100 index before dynamic crowdsourced decay.
- `width_class` *(String)*: Physical road width category (`two_lane` >= 5.5m, `intermediate` 3.75–5.5m, `single_lane` < 3.75m).
- `gradient_pct` *(Float)*: Longitudinal road incline percentage calculated via SRTM elevation deltas.

### D. Railway Network Layer (`ner_railway_network.json`)
- `code` *(String)*: Official Indian Railways 3/4-letter station code (e.g., `GHY`, `DBRG`, `SCL`, `DMV`, `AGTL`, `NHLN`).
- `name` *(String)*: Official station name.
- `division` *(String)*: NFR operating division (`LMG` Lumding, `TSK` Tinsukia, `APDJ` Alipurduar, `RNY` Rangiya).
- `is_freight_terminal` *(Boolean)*: Flags whether the node contains active goods sheds, sidings, or container yards.
- `lat` / `lon` *(Float)*: WGS-84 coordinate coordinates.

---

## 3. Vehicle Roster & Terrain Constraints

| Vehicle Code / Type | Name & Archetype | Payload (kg / m³) | Max Gradient (%) | Suitable Terrains | Thermal Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **pickup_4x4** | Mahindra Bolero Camper 4x4 | 1,500 kg / 6.0 m³ | 32.0% | Plains, Hilly, Mountainous | Active Reefer (-18°C to +4°C) |
| **mini_truck** | Tata Ace Gold Diesel Feeder | 1,000 kg / 4.5 m³ | 18.0% | Plains, Hilly | Passive Insulated (+4°C to +15°C) |
| **heavy_truck** | Ashok Leyland 16T HCV Reefer | 16,000 kg / 35.0 m³ | 8.0% | Arterial Plains / National Highways | Dual-Temp Reefer |
| **cargo_bike** | Mountain Heavy-Duty E-Cargo Bike | 100 kg / 0.5 m³ | 24.0% | High Mountain Hamlet Trails | Portable Active Vaccine Box |
| **tractor_trailer** | Swaraj 855 Agro Farm Tractor | 3,500 kg / 12.0 m³ | 8.0% | Rural Valley Mud / Unpaved Tracks | Non-refrigerated Ambient |
| **riverine_boat** | Brahmaputra Riverine Cargo Barge | 4,500 kg / 20.0 m³ | 0.0% | Inland Waterways (NW-2 Pandu-Neamati) | Solar Reefer |
| **rail_cargo_wagon** | NFR Container Wagon Rake | 55,000 kg / 85.0 m³ | 2.5% | Dedicated Rail Freight Siding Corridors | Multi-Compartment Freight |

---

## 4. Licensing & Attribution
- **Census of India (PCA)**: Published by the Office of the Registrar General & Census Commissioner of India, Government of India under Government Open Data License (GODL).
- **PMGSY GeoSadak**: Published under Government Open Data License - India (GODL). Free for public and research reuse.
- **NASA/USGS SRTM**: Public domain worldwide elevation data.
- **Indian Railways / GatiShakti**: Open data via National Data & Analytics Platform (NDAP) and GatiShakti GeoPortal.
