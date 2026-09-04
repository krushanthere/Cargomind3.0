"""
CargoMind 3.0 — NER Primary Census Abstract (PCA) Data Ingestion Engine
========================================================================
Processes and standardizes 2011 Primary Census Abstract data across 8
North Eastern Region (NER) states:
- Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura

Generates:
1. ner_census_pca_summary.json (State-by-state and NER regional aggregated metrics)
2. ner_census_settlements.json (All 3,379 villages, CD blocks, and towns with demographics & demand proxies)
3. ner_census_blocks.json (CD Block level aggregated freight and population profiles)
"""

import os
import glob
import json
import numpy as np
import pandas as pd
from pathlib import Path

BASE_BACKENDS_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = str(BASE_BACKENDS_DIR / "data" / "raw" / "census_pca")
PROCESSED_DIR = str(BASE_BACKENDS_DIR / "data" / "processed")

STATE_NAME_MAP = {
    "ARUNACHAL PRADESH": "Arunachal Pradesh",
    "ASSAM": "Assam",
    "MANIPUR": "Manipur",
    "MEGHALAYA": "Meghalaya",
    "MIZORAM": "Mizoram",
    "NAGALAND": "Nagaland",
    "SIKKIM": "Sikkim",
    "TRIPURA": "Tripura",
}

STATE_CODE_MAP = {
    "Arunachal Pradesh": "AR",
    "Assam": "AS",
    "Manipur": "MN",
    "Meghalaya": "ML",
    "Mizoram": "MZ",
    "Nagaland": "NL",
    "Sikkim": "SK",
    "Tripura": "TR",
}


def clean_int(val) -> int:
    try:
        if pd.isna(val):
            return 0
        return int(float(val))
    except Exception:
        return 0


def clean_str(val) -> str:
    if pd.isna(val):
        return ""
    return str(val).strip()


def process_all_census_data():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    files = sorted(glob.glob(os.path.join(RAW_DIR, "*.xls")))
    print(f"🔄 Ingesting {len(files)} state census spreadsheets from {RAW_DIR}...")

    all_settlements: List[Dict[str, Any]] = []
    state_summaries: Dict[str, Any] = {}

    total_ner_population = 0
    total_ner_households = 0
    total_ner_cultivators = 0
    total_ner_agri_labourers = 0
    total_ner_workers = 0
    total_ner_literates = 0
    total_ner_st = 0
    total_ner_sc = 0

    for file_path in files:
        fname = os.path.basename(file_path)
        print(f"  📄 Processing {fname}...")
        df = pd.read_excel(file_path)

        raw_state_name = clean_str(df["State/UTs_Name"].iloc[0]) if "State/UTs_Name" in df.columns else fname
        state_name = STATE_NAME_MAP.get(raw_state_name.upper(), raw_state_name.title())
        state_code = STATE_CODE_MAP.get(state_name, "NER")

        state_villages_count = 0
        state_blocks_count = 0
        state_towns_count = 0

        state_pop = 0
        state_hh = 0
        state_cultivators = 0
        state_agri_lab = 0
        state_workers = 0
        state_lit = 0
        state_st_pop = 0
        state_sc_pop = 0

        for _, row in df.iterrows():
            level = clean_str(row.get("Level", "VILLAGE")).upper()
            name = clean_str(row.get("Name", "Unknown"))
            district_name = clean_str(row.get("District_Name", "")).title()
            tru = clean_str(row.get("Total/Rural/Urban", "Rural")).capitalize()

            state_code_num = clean_int(row.get("State/UTs_Code", 0))
            district_code = clean_int(row.get("District_Code", 0))
            cd_block_code = clean_int(row.get("CD Block_Code", 0))
            town_village_code = clean_int(row.get("Town/Village_Code", 0))

            households = clean_int(row.get("No of Households", 0))
            tot_pop = clean_int(row.get("Total Population Person", 0))
            male_pop = clean_int(row.get("Total Population Male", 0))
            female_pop = clean_int(row.get("Total Population Female", 0))
            child_0_6 = clean_int(row.get("Population in the age group 0-6 Person", 0))

            sc_pop = clean_int(row.get("Scheduled Castes population Person", 0))
            st_pop = clean_int(row.get("Scheduled Tribes population Person", 0))
            literates = clean_int(row.get("Literates Population Person", 0))
            illiterates = clean_int(row.get("Illiterate Persons", 0))

            total_workers = clean_int(row.get("Total Worker Population Person", 0))
            main_workers = clean_int(row.get("Main Working Population Person", 0))
            main_cultivators = clean_int(row.get("Main Cultivator Population Person", 0))
            main_agri_lab = clean_int(row.get("Main Agricultural Labourers Population Person", 0))
            main_household_ind = clean_int(row.get("Main Household Industries Population Person", 0))
            main_other_workers = clean_int(row.get("Main Other Workers Population Person", 0))

            marginal_workers = clean_int(row.get("Marginal Worker Population Person", 0))
            marginal_cultivators = clean_int(row.get("Marginal Cultivator Population Person", 0))
            marginal_agri_lab = clean_int(row.get("Marginal Agriculture Labourers Population Person", 0))
            non_workers = clean_int(row.get("Non Working Population Person", 0))

            # Track counts
            if level == "VILLAGE":
                state_villages_count += 1
                state_pop += tot_pop
                state_hh += households
                state_cultivators += main_cultivators
                state_agri_lab += main_agri_lab
                state_workers += total_workers
                state_lit += literates
                state_st_pop += st_pop
                state_sc_pop += sc_pop
            elif level == "CD BLOCK":
                state_blocks_count += 1
            elif level == "TOWN":
                state_towns_count += 1

            # Derived Ratios
            lit_pct = round((literates / tot_pop) * 100, 1) if tot_pop > 0 else 0.0
            st_sc_pct = round(((st_pop + sc_pop) / tot_pop) * 100, 1) if tot_pop > 0 else 0.0
            cultivator_ratio_pct = round((main_cultivators / total_workers) * 100, 1) if total_workers > 0 else 0.0
            agri_workforce_total = main_cultivators + main_agri_lab + marginal_cultivators + marginal_agri_lab
            agri_workforce_pct = round((agri_workforce_total / total_workers) * 100, 1) if total_workers > 0 else 0.0

            # Freight & Demand Proxies
            daily_agri_produce_kg = round(main_cultivators * 18.5 + marginal_cultivators * 9.0 + main_agri_lab * 4.5, 1)
            daily_inbound_freight_kg = round(households * 3.8 + tot_pop * 0.45, 1)
            coldchain_pharma_demand_units = round(child_0_6 * 0.85 + tot_pop * 0.04, 1)

            settlement_record = {
                "state": state_name,
                "state_code": state_code,
                "district": district_name,
                "level": level,
                "name": name,
                "area_type": tru,
                "state_code_num": state_code_num,
                "district_code": district_code,
                "cd_block_code": cd_block_code,
                "town_village_code": town_village_code,
                "households": households,
                "total_population": tot_pop,
                "male_population": male_pop,
                "female_population": female_pop,
                "child_0_6_population": child_0_6,
                "sc_population": sc_pop,
                "st_population": st_pop,
                "st_sc_percentage": st_sc_pct,
                "literates_population": literates,
                "illiterates_population": illiterates,
                "literacy_rate_pct": lit_pct,
                "total_workers": total_workers,
                "main_workers": main_workers,
                "main_cultivators": main_cultivators,
                "main_agri_labourers": main_agri_lab,
                "main_household_industry": main_household_ind,
                "main_other_workers": main_other_workers,
                "marginal_workers": marginal_workers,
                "marginal_cultivators": marginal_cultivators,
                "marginal_agri_labourers": marginal_agri_lab,
                "non_workers": non_workers,
                "cultivator_ratio_pct": cultivator_ratio_pct,
                "agri_workforce_total": agri_workforce_total,
                "agri_workforce_pct": agri_workforce_pct,
                "logistics_metrics": {
                    "daily_agri_produce_kg": daily_agri_produce_kg,
                    "daily_agri_produce_tons": round(daily_agri_produce_kg / 1000.0, 2),
                    "daily_inbound_freight_kg": daily_inbound_freight_kg,
                    "daily_inbound_freight_tons": round(daily_inbound_freight_kg / 1000.0, 2),
                    "coldchain_pharma_demand_units": coldchain_pharma_demand_units,
                    "recommended_pickup_vehicle": "heavy_truck" if daily_agri_produce_kg > 4000 else ("pickup_4x4" if daily_agri_produce_kg > 800 else "mini_truck"),
                },
            }
            all_settlements.append(settlement_record)

        state_lit_rate = round((state_lit / state_pop) * 100, 1) if state_pop > 0 else 0.0
        state_agri_pct = round((state_cultivators + state_agri_lab) / state_workers * 100, 1) if state_workers > 0 else 0.0
        state_st_sc_pct = round((state_st_pop + state_sc_pop) / state_pop * 100, 1) if state_pop > 0 else 0.0

        state_summaries[state_name] = {
            "state_code": state_code,
            "total_settlements": len(df),
            "villages_count": state_villages_count,
            "cd_blocks_count": state_blocks_count,
            "towns_count": state_towns_count,
            "total_population": state_pop,
            "total_households": state_hh,
            "total_workers": state_workers,
            "main_cultivators": state_cultivators,
            "main_agri_labourers": state_agri_lab,
            "literates_population": state_lit,
            "literacy_rate_pct": state_lit_rate,
            "st_population": state_st_pop,
            "sc_population": state_sc_pop,
            "st_sc_percentage": state_st_sc_pct,
            "agri_workforce_pct": state_agri_pct,
            "daily_agri_tonnage": round((state_cultivators * 18.5 + state_agri_lab * 4.5) / 1000.0, 1),
            "daily_inbound_tonnage": round((state_hh * 3.8 + state_pop * 0.45) / 1000.0, 1),
        }

        total_ner_population += state_pop
        total_ner_households += state_hh
        total_ner_cultivators += state_cultivators
        total_ner_agri_labourers += state_agri_lab
        total_ner_workers += state_workers
        total_ner_literates += state_lit
        total_ner_st += state_st_pop
        total_ner_sc += state_sc_pop

    block_records = [s for s in all_settlements if s["level"] == "CD BLOCK"]
    
    overall_summary = {
        "dataset_name": "Census of India 2011 Primary Census Abstract (PCA)",
        "authority": "Office of the Registrar General & Census Commissioner of India, Ministry of Home Affairs",
        "license": "Government Open Data License - India (GODL)",
        "region": "North Eastern Region (NER), India",
        "states_count": len(state_summaries),
        "total_records": len(all_settlements),
        "total_villages": sum(s["villages_count"] for s in state_summaries.values()),
        "total_cd_blocks": sum(s["cd_blocks_count"] for s in state_summaries.values()),
        "total_towns": sum(s["towns_count"] for s in state_summaries.values()),
        "total_population": total_ner_population,
        "total_households": total_ner_households,
        "total_workers": total_ner_workers,
        "total_cultivators": total_ner_cultivators,
        "total_agricultural_labourers": total_ner_agri_labourers,
        "overall_literacy_rate_pct": round((total_ner_literates / total_ner_population) * 100, 1) if total_ner_population > 0 else 0.0,
        "overall_st_sc_pct": round(((total_ner_st + total_ner_sc) / total_ner_population) * 100, 1) if total_ner_population > 0 else 0.0,
        "total_daily_agri_produce_tons": round((total_ner_cultivators * 18.5 + total_ner_agri_labourers * 4.5) / 1000.0, 1),
        "total_daily_inbound_freight_tons": round((total_ner_households * 3.8 + total_ner_population * 0.45) / 1000.0, 1),
        "state_breakdown": state_summaries,
    }

    summary_file = os.path.join(PROCESSED_DIR, "ner_census_pca_summary.json")
    with open(summary_file, "w") as f:
        json.dump(overall_summary, f, indent=2)
    print(f"✅ Saved Census Summary: {summary_file}")

    settlements_file = os.path.join(PROCESSED_DIR, "ner_census_settlements.json")
    with open(settlements_file, "w") as f:
        json.dump(all_settlements, f, indent=2)
    print(f"✅ Saved {len(all_settlements)} Clean Settlements: {settlements_file}")

    blocks_file = os.path.join(PROCESSED_DIR, "ner_census_blocks.json")
    with open(blocks_file, "w") as f:
        json.dump(block_records, f, indent=2)
    print(f"✅ Saved {len(block_records)} CD Blocks: {blocks_file}")

    print("\n======================================================================")
    print(f"  🎉 Successfully Processed {len(all_settlements)} Census Settlements!")
    print(f"  📍 8 States: {', '.join(state_summaries.keys())}")
    print(f"  👥 Total Population: {total_ner_population:,}")
    print(f"  🌾 Cultivators & Farmers: {total_ner_cultivators:,}")
    print(f"  🚜 Agricultural Labourers: {total_ner_agri_labourers:,}")
    print(f"  🏠 Total Households: {total_ner_households:,}")
    print("======================================================================")


if __name__ == "__main__":
    process_all_census_data()
