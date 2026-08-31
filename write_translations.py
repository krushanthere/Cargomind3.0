import json
import os

messages_dir = "/Users/krushantapodha/Untitled23/frontend/messages"
os.makedirs(messages_dir, exist_ok=True)

en = {
  "nav": {
    "overview": "Overview",
    "topology": "Topology",
    "pickups": "Pickups",
    "dispatch": "Dispatch",
    "kinetics": "Kinetics",
    "fairness": "Fairness",
    "terrain": "Terrain",
    "aiIntelligence": "AI Intelligence",
    "about": "About",
    "launchAI": "LAUNCH AI",
    "searchPlaceholder": "Search routes, nodes, shipments...",
    "replayIntro": "REPLAY INTRO",
    "currentLabel": "CURRENT",
    "sectionTitles": {
      "overview": "00 // OVERVIEW",
      "network": "01 // TOPOLOGY",
      "shipments": "02 // PICKUPS",
      "dispatch": "03 // DISPATCH",
      "kinetics": "04 // KINETICS",
      "fairness": "05 // FAIRNESS",
      "alerts": "06 // ALERTS"
    },
    "brandSubtitle": "Swiss Intelligence"
  },
  "intro": {
    "skipIntro": "SKIP INTRO",
    "tagline": "Logistics AI for the Last Mile",
    "protocol": "INITIALIZING PROTOCOL",
    "sysVersion": "SYS.V.3.0",
    "bootSteps": {
      "init": "INITIALIZING...",
      "arrhenius": "ARRHENIUS MODELS LOADED",
      "solver": "CP-SAT SOLVER READY",
      "online": "SYSTEM ONLINE"
    },
    "bottomBar": {
      "solver": "OR-TOOLS // SHAPLEY // V3",
      "entering": "ENTERING CARGOMIND"
    }
  },
  "home": {
    "status": {
      "engineLabel": "Dispatch Engine",
      "categories": "Categories",
      "onlineStatus": "Online",
      "offlineStatus": "Offline",
      "syncNow": "Sync Now",
      "syncing": "Syncing...",
      "queued": "Queued"
    },
    "overview": {
      "dispatchRef": "Dispatch Ref",
      "clusters": "Active Clusters",
      "dynamicMatchingVector": "Dynamic Matching Vector",
      "engineVersion": "Engine Version",
      "heroHeadline": "Logistics",
      "heroSubheadline": "Intelligence",
      "heroDescription": "Fair and optimal dispatch network.",
      "fairnessIndex": "Fairness Index",
      "starvationRisk": "Starvation Risk",
      "coldBuffer": "Cold Buffer",
      "solarProtected": "Solar Protected",
      "goodTypeLabel": "Good Type",
      "urgencyLabel": "Urgency",
      "terrainLabel": "Terrain",
      "ambientTempLabel": "Ambient Temp",
      "dispatchScore": "Dispatch Score",
      "pendingPickups": "Pending Pickups",
      "matchButton": "Match",
      "matchingButton": "Matching..."
    },
    "network": {
      "sectionLabel": "Network",
      "title": "Network Topology",
      "hubCount": "Hub Count",
      "selectNode": "Select Node",
      "tableHeaders": {
        "nodeType": "Node Type",
        "powerSource": "Power Source",
        "coldCapacity": "Cold Capacity",
        "status": "Status"
      },
      "nodeTelemetry": "Node Telemetry",
      "coldStorageFill": "Cold Storage Fill",
      "thermalProtocol": "Thermal Protocol",
      "activeThermalShield": "Active Thermal Shield",
      "availableFleet": "Available Fleet",
      "terrainAccessibility": "Terrain Accessibility",
      "allWeatherCapable": "All Weather Capable"
    },
    "shipments": {
      "sectionLabel": "Shipments",
      "title": "Shipments",
      "filters": {
        "all": "All",
        "medicine": "Medicine",
        "produce": "Produce",
        "critical": "Critical"
      },
      "tableHeaders": {
        "pickup": "Pickup",
        "producer": "Producer",
        "classification": "Classification",
        "urgency": "Urgency",
        "weight": "Weight",
        "waitTime": "Wait Time",
        "status": "Status"
      },
      "form": {
        "title": "New Shipment",
        "originLabel": "Origin",
        "destLabel": "Destination",
        "producerLabel": "Producer",
        "goodTypeLabel": "Good Type",
        "urgencyLabel": "Urgency",
        "weightLabel": "Weight",
        "submit": "Submit"
      }
    },
    "dispatch": {
      "sectionLabel": "Dispatch",
      "title": "Dispatch Engine",
      "windowToggle": "Window Toggle",
      "enabled": "Enabled",
      "disabled": "Disabled",
      "fairnessSummaryLabel": "Fairness Summary",
      "triggerDispatch": "Trigger Dispatch",
      "triggerButton": "Run",
      "computing": "Computing...",
      "noMatches": "No Matches",
      "clickToRun": "Click to Run",
      "matchLabels": {
        "waitTime": "Wait Time",
        "fairnessBoost": "Fairness Boost",
        "urgency": "Urgency"
      },
      "transparentExplanation": "Transparent Explanation"
    },
    "kinetics": {
      "sectionLabel": "Kinetics",
      "title": "Spoilage Kinetics",
      "activationEnergy": "Activation Energy",
      "ambientTemp": "Ambient Temp",
      "transitDuration": "Transit Duration",
      "solarBufferActive": "Solar Buffer Active",
      "solarDesc": "Solar Desc",
      "solarOn": "Solar On",
      "gridOnly": "Grid Only",
      "qualityLoss": "Quality Loss",
      "minimalSpoilage": "Minimal Spoilage",
      "moderateLoad": "Moderate Load",
      "criticalCooling": "Critical Cooling",
      "telemetryPings": "Telemetry Pings"
    },
    "fairness": {
      "sectionLabel": "Fairness",
      "title": "Fairness Metrics",
      "fairnessIndexLabel": "Fairness Index",
      "provable": "Provable",
      "waitTimeDistribution": "Wait Time Distribution",
      "avgWait": "Avg Wait",
      "maxWait": "Max Wait",
      "dispatches": "Dispatches",
      "proofTitle": "Proof",
      "proofDescription": "Proof Description",
      "proofPoints": {
        "p1": "Point 1",
        "p2": "Point 2",
        "p3": "Point 3"
      }
    },
    "alerts": {
      "sectionLabel": "Alerts",
      "title": "Alerts",
      "subtitle": "System Alerts",
      "statuses": {
        "activeCaution": "Active Caution",
        "handled": "Handled",
        "optimal": "Optimal"
      }
    }
  },
  "about": {
    "breadcrumb": {
      "module": "Module",
      "subtitle": "Subtitle",
      "version": "Version"
    },
    "hero": {
      "label": "Hero Label",
      "headline": "Headline",
      "headlineBold": "Headline Bold",
      "description": "Description"
    },
    "pillars": {
      "p1": {
        "label": "Label 1",
        "title": "Title 1",
        "description": "Description 1",
        "metric": "Metric 1"
      },
      "p2": {
        "label": "Label 2",
        "title": "Title 2",
        "description": "Description 2",
        "metric": "Metric 2"
      },
      "p3": {
        "label": "Label 3",
        "title": "Title 3",
        "description": "Description 3",
        "metric": "Metric 3"
      }
    },
    "architecture": {
      "label": "Architecture",
      "title": "Architecture Title",
      "steps": {
        "s01": {
          "title": "Step 1",
          "description": "Desc 1"
        },
        "s02": {
          "title": "Step 2",
          "description": "Desc 2"
        },
        "s03": {
          "title": "Step 3",
          "description": "Desc 3"
        },
        "s04": {
          "title": "Step 4",
          "description": "Desc 4"
        }
      }
    },
    "form": {
      "label": "Form Label",
      "headline": "Form Headline",
      "headlineBold": "Form Headline Bold",
      "description": "Form Description",
      "fields": {
        "name": "Name",
        "email": "Email",
        "cluster": "Cluster"
      },
      "placeholders": {
        "name": "Name",
        "email": "Email",
        "cluster": "Cluster"
      },
      "submit": "Submit",
      "transmitLabel": "Transmit",
      "success": {
        "title": "Success",
        "description": "Success Description"
      }
    }
  },
  "ai": {
    "breadcrumb": {
      "module": "AI",
      "subtitle": "AI Intelligence"
    },
    "status": {
      "latency": "Latency",
      "fairnessIndex": "Fairness Index"
    },
    "header": {
      "label": "Header Label",
      "title": "Header Title",
      "titleBold": "Header Title Bold"
    },
    "buttons": {
      "runSolver": "Run Solver",
      "running": "Running"
    },
    "params": {
      "corridor": "Corridor",
      "goodType": "Good Type",
      "vehicleType": "Vehicle Type",
      "waitTime": "Wait Time",
      "ambientTemp": "Ambient Temp",
      "goodTypes": {
        "farmProduce": "Farm Produce",
        "medicine": "Medicine",
        "essentialGoods": "Essential Goods"
      },
      "goodTypeSubs": {
        "farmProduce": "Farm Produce Sub",
        "medicine": "Medicine Sub",
        "essentialGoods": "Essential Goods Sub"
      },
      "vehicles": {
        "tempo": "Tempo",
        "tractor": "Tractor",
        "auto": "Auto",
        "motorbike": "Motorbike"
      },
      "waitLabels": {
        "fresh": "Fresh",
        "regionalAvg": "Regional Avg",
        "starvationRisk": "Starvation Risk"
      },
      "nominal": "Nominal",
      "aboveBaseline": "Above Baseline"
    },
    "metrics": {
      "dispatchScore": "Dispatch Score",
      "highPriority": "High Priority",
      "fairnessBoost": "Fairness Boost",
      "waitTimeEquity": "Wait Time Equity",
      "perishableDecay": "Perishable Decay",
      "arrheniusSpoilage": "Arrhenius Spoilage",
      "effectiveTransit": "Effective Transit",
      "terrainAdjusted": "Terrain Adjusted"
    },
    "attribution": {
      "label": "Attribution",
      "title": "Attribution Title",
      "shapley": "SHAP",
      "spoilageRisk": "Spoilage Risk",
      "medicineSafeguard": "Medicine Safeguard",
      "fairnessDisparity": "Fairness Disparity",
      "terrainCompatibility": "Terrain Compatibility",
      "vehiclePayload": "Vehicle Payload"
    },
    "synthesis": {
      "title": "Synthesis",
      "dispatchDecision": "Dispatch Decision",
      "whyThisVehicle": "Why This Vehicle"
    }
  },
  "common": {
    "goodTypes": {
      "farmProduce": "Farm Produce",
      "medicine": "Medicine",
      "essentialGoods": "Essential Goods"
    },
    "urgency": {
      "critical": "Critical",
      "high": "High",
      "routine": "Routine",
      "criticalImmediate": "Critical Immediate",
      "highPriority": "High Priority",
      "routineBatch": "Routine Batch"
    },
    "status": {
      "pending": "Pending",
      "dispatched": "Dispatched",
      "inTransit": "In Transit",
      "delivered": "Delivered"
    },
    "terrain": {
      "paved": "Paved",
      "unpaved": "Unpaved",
      "seasonal": "Seasonal",
      "floodRisk": "Flood Risk"
    },
    "power": {
      "solar": "Solar",
      "unreliable": "Unreliable",
      "grid": "Grid"
    },
    "riskStatus": {
      "optimal": "Optimal",
      "moderate": "Moderate",
      "constrained": "Constrained"
    },
    "units": {
      "kg": "kg",
      "celsius": "°C",
      "hours": "h",
      "minutes": "min",
      "cubicMeters": "m³",
      "pts": "pts"
    }
  },
  "search": {
    "title": "Search",
    "placeholder": "Search...",
    "noResults": "No results found"
  },
  "languageSwitcher": {
    "label": "Language",
    "en": "English",
    "hi": "हिन्दी",
    "or": "ଓଡ଼ିଆ"
  }
}

hi = en.copy()
# Hindi Translations
hi["nav"] = {
    "overview": "अवलोकन",
    "topology": "टोपोलॉजी",
    "pickups": "पिकअप",
    "dispatch": "डिस्पैच",
    "kinetics": "कैनेटीक्स",
    "fairness": "निष्पक्षता",
    "terrain": "इलाका",
    "aiIntelligence": "AI इंटेलिजेंस",
    "about": "के बारे में",
    "launchAI": "LAUNCH AI",
    "searchPlaceholder": "मार्ग, नोड्स, शिपमेंट खोजें...",
    "replayIntro": "REPLAY INTRO",
    "currentLabel": "वर्तमान",
    "sectionTitles": {
      "overview": "00 // अवलोकन",
      "network": "01 // टोपोलॉजी",
      "shipments": "02 // पिकअप",
      "dispatch": "03 // डिस्पैच",
      "kinetics": "04 // कैनेटीक्स",
      "fairness": "05 // निष्पक्षता",
      "alerts": "06 // अलर्ट"
    },
    "brandSubtitle": "स्विस इंटेलिजेंस"
}
hi["intro"] = {
    "skipIntro": "स्किप इंट्रो",
    "tagline": "लास्ट माइल के लिए लॉजिस्टिक्स AI",
    "protocol": "प्रोटोकॉल प्रारंभ हो रहा है",
    "sysVersion": "SYS.V.3.0",
    "bootSteps": {
      "init": "प्रारंभ हो रहा है...",
      "arrhenius": "Arrhenius मॉडल लोड किए गए",
      "solver": "CP-SAT सॉल्वर तैयार",
      "online": "सिस्टम ऑनलाइन"
    },
    "bottomBar": {
      "solver": "OR-Tools // SHAPLEY // V3",
      "entering": "CargoMind में प्रवेश"
    }
}
hi["home"] = {
    "status": {
      "engineLabel": "डिस्पैच इंजन",
      "categories": "श्रेणियाँ",
      "onlineStatus": "ऑनलाइन",
      "offlineStatus": "ऑफ़लाइन",
      "syncNow": "अभी सिंक करें",
      "syncing": "सिंक हो रहा है...",
      "queued": "कतार में"
    },
    "overview": {
      "dispatchRef": "डिस्पैच संदर्भ",
      "clusters": "सक्रिय क्लस्टर",
      "dynamicMatchingVector": "डायनेमिक मैचिंग वेक्टर",
      "engineVersion": "इंजन संस्करण",
      "heroHeadline": "लॉजिस्टिक्स",
      "heroSubheadline": "इंटेलिजेंस",
      "heroDescription": "निष्पक्ष और इष्टतम डिस्पैच नेटवर्क।",
      "fairnessIndex": "निष्पक्षता सूचकांक",
      "starvationRisk": "भुखमरी का जोखिम",
      "coldBuffer": "कोल्ड बफर",
      "solarProtected": "सौर संरक्षित",
      "goodTypeLabel": "माल का प्रकार",
      "urgencyLabel": "तात्कालिकता",
      "terrainLabel": "इलाका",
      "ambientTempLabel": "परिवेश का तापमान",
      "dispatchScore": "डिस्पैच स्कोर",
      "pendingPickups": "लंबित पिकअप",
      "matchButton": "मैच",
      "matchingButton": "मैचिंग..."
    },
    "network": {
      "sectionLabel": "नेटवर्क",
      "title": "नेटवर्क टोपोलॉजी",
      "hubCount": "हब की संख्या",
      "selectNode": "नोड चुनें",
      "tableHeaders": {
        "nodeType": "नोड प्रकार",
        "powerSource": "शक्ति स्रोत",
        "coldCapacity": "कोल्ड क्षमता",
        "status": "स्थिति"
      },
      "nodeTelemetry": "नोड टेलीमेट्री",
      "coldStorageFill": "कोल्ड स्टोरेज भरें",
      "thermalProtocol": "थर्मल प्रोटोकॉल",
      "activeThermalShield": "सक्रिय थर्मल शील्ड",
      "availableFleet": "उपलब्ध फ्लीट",
      "terrainAccessibility": "इलाके की पहुंच",
      "allWeatherCapable": "सभी मौसम में सक्षम"
    },
    "shipments": {
      "sectionLabel": "शिपमेंट",
      "title": "शिपमेंट",
      "filters": {
        "all": "सभी",
        "medicine": "दवा",
        "produce": "उपज",
        "critical": "गंभीर"
      },
      "tableHeaders": {
        "pickup": "पिकअप",
        "producer": "उत्पादक",
        "classification": "वर्गीकरण",
        "urgency": "तात्कालिकता",
        "weight": "वजन",
        "waitTime": "प्रतीक्षा समय",
        "status": "स्थिति"
      },
      "form": {
        "title": "नया शिपमेंट",
        "originLabel": "मूल",
        "destLabel": "गंतव्य",
        "producerLabel": "उत्पादक",
        "goodTypeLabel": "माल का प्रकार",
        "urgencyLabel": "तात्कालिकता",
        "weightLabel": "वजन",
        "submit": "जमा करें"
      }
    },
    "dispatch": {
      "sectionLabel": "डिस्पैच",
      "title": "डिस्पैच इंजन",
      "windowToggle": "विंडो टॉगल",
      "enabled": "सक्षम",
      "disabled": "अक्षम",
      "fairnessSummaryLabel": "निष्पक्षता सारांश",
      "triggerDispatch": "ट्रिगर डिस्पैच",
      "triggerButton": "चलाएं",
      "computing": "गणना हो रही है...",
      "noMatches": "कोई मैच नहीं मिला",
      "clickToRun": "चलाने के लिए क्लिक करें",
      "matchLabels": {
        "waitTime": "प्रतीक्षा समय",
        "fairnessBoost": "निष्पक्षता बढ़ावा",
        "urgency": "तात्कालिकता"
      },
      "transparentExplanation": "पारदर्शी स्पष्टीकरण"
    },
    "kinetics": {
      "sectionLabel": "कैनेटीक्स",
      "title": "खराबी कैनेटीक्स",
      "activationEnergy": "सक्रियण ऊर्जा",
      "ambientTemp": "परिवेश का तापमान",
      "transitDuration": "पारगमन अवधि",
      "solarBufferActive": "सौर बफर सक्रिय",
      "solarDesc": "सौर विवरण",
      "solarOn": "सौर चालू",
      "gridOnly": "केवल ग्रिड",
      "qualityLoss": "गुणवत्ता का नुकसान",
      "minimalSpoilage": "न्यूनतम खराबी",
      "moderateLoad": "मध्यम भार",
      "criticalCooling": "महत्वपूर्ण शीतलन",
      "telemetryPings": "टेलीमेट्री पिंग्स"
    },
    "fairness": {
      "sectionLabel": "निष्पक्षता",
      "title": "निष्पक्षता मेट्रिक्स",
      "fairnessIndexLabel": "निष्पक्षता सूचकांक",
      "provable": "प्रमाणनीय",
      "waitTimeDistribution": "प्रतीक्षा समय वितरण",
      "avgWait": "औसत प्रतीक्षा",
      "maxWait": "अधिकतम प्रतीक्षा",
      "dispatches": "डिस्पैच",
      "proofTitle": "प्रमाण",
      "proofDescription": "प्रमाण विवरण",
      "proofPoints": {
        "p1": "बिंदु 1",
        "p2": "बिंदु 2",
        "p3": "बिंदु 3"
      }
    },
    "alerts": {
      "sectionLabel": "अलर्ट",
      "title": "अलर्ट",
      "subtitle": "सिस्टम अलर्ट",
      "statuses": {
        "activeCaution": "सक्रिय चेतावनी",
        "handled": "संभाला गया",
        "optimal": "इष्टतम"
      }
    }
}
hi["about"] = {
    "breadcrumb": {
      "module": "मॉड्यूल",
      "subtitle": "उपशीर्षक",
      "version": "संस्करण"
    },
    "hero": {
      "label": "हीरो लेबल",
      "headline": "सुर्खियां",
      "headlineBold": "सुर्खियां बोल्ड",
      "description": "विवरण"
    },
    "pillars": {
      "p1": {
        "label": "लेबल 1",
        "title": "शीर्षक 1",
        "description": "विवरण 1",
        "metric": "मेट्रिक 1"
      },
      "p2": {
        "label": "लेबल 2",
        "title": "शीर्षक 2",
        "description": "विवरण 2",
        "metric": "मेट्रिक 2"
      },
      "p3": {
        "label": "लेबल 3",
        "title": "शीर्षक 3",
        "description": "विवरण 3",
        "metric": "मेट्रिक 3"
      }
    },
    "architecture": {
      "label": "आर्किटेक्चर",
      "title": "आर्किटेक्चर शीर्षक",
      "steps": {
        "s01": {
          "title": "चरण 1",
          "description": "विवरण 1"
        },
        "s02": {
          "title": "चरण 2",
          "description": "विवरण 2"
        },
        "s03": {
          "title": "चरण 3",
          "description": "विवरण 3"
        },
        "s04": {
          "title": "चरण 4",
          "description": "विवरण 4"
        }
      }
    },
    "form": {
      "label": "फॉर्म लेबल",
      "headline": "फॉर्म हेडलाइन",
      "headlineBold": "फॉर्म हेडलाइन बोल्ड",
      "description": "फॉर्म विवरण",
      "fields": {
        "name": "नाम",
        "email": "ईमेल",
        "cluster": "क्लस्टर"
      },
      "placeholders": {
        "name": "नाम",
        "email": "ईमेल",
        "cluster": "क्लस्टर"
      },
      "submit": "जमा करें",
      "transmitLabel": "संचरित करें",
      "success": {
        "title": "सफलता",
        "description": "सफलता का विवरण"
      }
    }
}
hi["ai"] = {
    "breadcrumb": {
      "module": "AI",
      "subtitle": "AI इंटेलिजेंस"
    },
    "status": {
      "latency": "विलंबता",
      "fairnessIndex": "निष्पक्षता सूचकांक"
    },
    "header": {
      "label": "हेडर लेबल",
      "title": "हेडर शीर्षक",
      "titleBold": "हेडर शीर्षक बोल्ड"
    },
    "buttons": {
      "runSolver": "सॉल्वर चलाएँ",
      "running": "चल रहा है"
    },
    "params": {
      "corridor": "गलियारा",
      "goodType": "माल का प्रकार",
      "vehicleType": "वाहन का प्रकार",
      "waitTime": "प्रतीक्षा समय",
      "ambientTemp": "परिवेश का तापमान",
      "goodTypes": {
        "farmProduce": "कृषि उपज",
        "medicine": "दवा",
        "essentialGoods": "आवश्यक वस्तुएं"
      },
      "goodTypeSubs": {
        "farmProduce": "कृषि उपज उप",
        "medicine": "दवा उप",
        "essentialGoods": "आवश्यक वस्तुएं उप"
      },
      "vehicles": {
        "tempo": "टेम्पो",
        "tractor": "ट्रैक्टर",
        "auto": "ऑटो",
        "motorbike": "मोटरबाइक"
      },
      "waitLabels": {
        "fresh": "ताज़ा",
        "regionalAvg": "क्षेत्रीय औसत",
        "starvationRisk": "भुखमरी का जोखिम"
      },
      "nominal": "नाममात्र",
      "aboveBaseline": "बेसलाइन से ऊपर"
    },
    "metrics": {
      "dispatchScore": "डिस्पैच स्कोर",
      "highPriority": "उच्च प्राथमिकता",
      "fairnessBoost": "निष्पक्षता बढ़ावा",
      "waitTimeEquity": "प्रतीक्षा समय इक्विटी",
      "perishableDecay": "खराब होने वाली क्षय",
      "arrheniusSpoilage": "Arrhenius खराबी",
      "effectiveTransit": "प्रभावी पारगमन",
      "terrainAdjusted": "इलाका समायोजित"
    },
    "attribution": {
      "label": "एट्रिब्यूशन",
      "title": "एट्रिब्यूशन शीर्षक",
      "shapley": "SHAP",
      "spoilageRisk": "खराबी का जोखिम",
      "medicineSafeguard": "दवा सुरक्षा",
      "fairnessDisparity": "निष्पक्षता असमानता",
      "terrainCompatibility": "इलाके की संगतता",
      "vehiclePayload": "वाहन पेलोड"
    },
    "synthesis": {
      "title": "संश्लेषण",
      "dispatchDecision": "डिस्पैच निर्णय",
      "whyThisVehicle": "यह वाहन क्यों"
    }
}
hi["common"] = {
    "goodTypes": {
      "farmProduce": "कृषि उपज",
      "medicine": "दवा",
      "essentialGoods": "आवश्यक वस्तुएं"
    },
    "urgency": {
      "critical": "गंभीर",
      "high": "उच्च",
      "routine": "नियमित",
      "criticalImmediate": "गंभीर तत्काल",
      "highPriority": "उच्च प्राथमिकता",
      "routineBatch": "नियमित बैच"
    },
    "status": {
      "pending": "लंबित",
      "dispatched": "भेजा गया",
      "inTransit": "रास्ते में",
      "delivered": "वितरित"
    },
    "terrain": {
      "paved": "पक्का",
      "unpaved": "कच्चा",
      "seasonal": "मौसमी",
      "floodRisk": "बाढ़ का जोखिम"
    },
    "power": {
      "solar": "सौर",
      "unreliable": "अविश्वसनीय",
      "grid": "ग्रिड"
    },
    "riskStatus": {
      "optimal": "इष्टतम",
      "moderate": "मध्यम",
      "constrained": "प्रतिबंधित"
    },
    "units": {
      "kg": "किग्रा",
      "celsius": "°C",
      "hours": "घंटे",
      "minutes": "मिनट",
      "cubicMeters": "m³",
      "pts": "pts"
    }
}
hi["search"] = {
    "title": "खोज",
    "placeholder": "खोजें...",
    "noResults": "कोई परिणाम नहीं मिला"
}
hi["languageSwitcher"] = en["languageSwitcher"]

or_ = en.copy()
# Odia Translations
or_["nav"] = {
    "overview": "ସମୀକ୍ଷା",
    "topology": "ଟୋପୋଲୋଜି",
    "pickups": "ପିକଅପ୍",
    "dispatch": "ପ୍ରେରଣ",
    "kinetics": "କାଇନେଟିକ୍ସ",
    "fairness": "ନିରପେକ୍ଷତା",
    "terrain": "ଭୂଖଣ୍ଡ",
    "aiIntelligence": "AI ଇଣ୍ଟେଲିଜେନ୍ସ",
    "about": "ବିଷୟରେ",
    "launchAI": "LAUNCH AI",
    "searchPlaceholder": "ମାର୍ଗ, ନୋଡ୍, ସିପମେଣ୍ଟ ଖୋଜନ୍ତୁ...",
    "replayIntro": "REPLAY INTRO",
    "currentLabel": "ବର୍ତ୍ତମାନ",
    "sectionTitles": {
      "overview": "00 // ସମୀକ୍ଷା",
      "network": "01 // ଟୋପୋଲୋଜି",
      "shipments": "02 // ପିକଅପ୍",
      "dispatch": "03 // ପ୍ରେରଣ",
      "kinetics": "04 // କାଇନେଟିକ୍ସ",
      "fairness": "05 // ନିରପେକ୍ଷତା",
      "alerts": "06 // ଆଲର୍ଟ"
    },
    "brandSubtitle": "ସ୍ୱିସ୍ ଇଣ୍ଟେଲିଜେନ୍ସ"
}
or_["intro"] = {
    "skipIntro": "ସ୍କିପ୍ ଇଣ୍ଟ୍ରୋ",
    "tagline": "ଲାଷ୍ଟ ମାଇଲ୍ ପାଇଁ ଲଜିଷ୍ଟିକ୍ସ AI",
    "protocol": "ପ୍ରୋଟୋକଲ୍ ଆରମ୍ଭ ହେଉଛି",
    "sysVersion": "SYS.V.3.0",
    "bootSteps": {
      "init": "ଆରମ୍ଭ ହେଉଛି...",
      "arrhenius": "Arrhenius ମଡେଲ୍ ଲୋଡ୍ ହେଲା",
      "solver": "CP-SAT ସଲଭର୍ ପ୍ରସ୍ତୁତ",
      "online": "ସିଷ୍ଟମ୍ ଅନଲାଇନ୍"
    },
    "bottomBar": {
      "solver": "OR-Tools // SHAPLEY // V3",
      "entering": "CargoMind ରେ ପ୍ରବେଶ"
    }
}
or_["home"] = {
    "status": {
      "engineLabel": "ଡିସ୍ପ୍ୟାଚ୍ ଇଞ୍ଜିନ୍",
      "categories": "ବିଭାଗ",
      "onlineStatus": "ଅନଲାଇନ୍",
      "offlineStatus": "ଅଫଲାଇନ୍",
      "syncNow": "ବର୍ତ୍ତମାନ ସିଙ୍କ୍ କରନ୍ତୁ",
      "syncing": "ସିଙ୍କ୍ ହେଉଛି...",
      "queued": "ଧାଡ଼ିରେ ଅଛି"
    },
    "overview": {
      "dispatchRef": "ଡିସ୍ପ୍ୟାଚ୍ ରେଫରେନ୍ସ",
      "clusters": "ସକ୍ରିୟ କ୍ଲଷ୍ଟର",
      "dynamicMatchingVector": "ଡାଇନାମିକ୍ ମ୍ୟାଚିଂ ଭେକ୍ଟର",
      "engineVersion": "ଇଞ୍ଜିନ୍ ସଂସ୍କରଣ",
      "heroHeadline": "ଲଜିଷ୍ଟିକ୍ସ",
      "heroSubheadline": "ଇଣ୍ଟେଲିଜେନ୍ସ",
      "heroDescription": "ନିରପେକ୍ଷ ଏବଂ ଉପଯୁକ୍ତ ଡିସ୍ପ୍ୟାଚ୍ ନେଟୱାର୍କ |",
      "fairnessIndex": "ନିରପେକ୍ଷତା ସୂଚକାଙ୍କ",
      "starvationRisk": "ଭୋକିଲା ବିପଦ",
      "coldBuffer": "କୋଲ୍ଡ ବଫର୍",
      "solarProtected": "ସୌର ସୁରକ୍ଷିତ",
      "goodTypeLabel": "ସାମଗ୍ରୀ ପ୍ରକାର",
      "urgencyLabel": "ଜରୁରୀକାଳୀନ",
      "terrainLabel": "ଭୂଖଣ୍ଡ",
      "ambientTempLabel": "ପରିବେଶ ତାପମାତ୍ରା",
      "dispatchScore": "ଡିସ୍ପ୍ୟାଚ୍ ସ୍କୋର୍",
      "pendingPickups": "ବକେୟା ପିକଅପ୍",
      "matchButton": "ମ୍ୟାଚ୍",
      "matchingButton": "ମ୍ୟାଚିଂ..."
    },
    "network": {
      "sectionLabel": "ନେଟୱାର୍କ",
      "title": "ନେଟୱାର୍କ ଟୋପୋଲୋଜି",
      "hubCount": "ହବ୍ ସଂଖ୍ୟା",
      "selectNode": "ନୋଡ୍ ବାଛନ୍ତୁ",
      "tableHeaders": {
        "nodeType": "ନୋଡ୍ ପ୍ରକାର",
        "powerSource": "ଶକ୍ତି ଉତ୍ସ",
        "coldCapacity": "କୋଲ୍ଡ କ୍ଷମତା",
        "status": "ସ୍ଥିତି"
      },
      "nodeTelemetry": "ନୋଡ୍ ଟେଲିମେଟ୍ରି",
      "coldStorageFill": "କୋଲ୍ଡ ଷ୍ଟୋରେଜ୍ ପୂର୍ଣ୍ଣ",
      "thermalProtocol": "ଥର୍ମାଲ୍ ପ୍ରୋଟୋକଲ୍",
      "activeThermalShield": "ସକ୍ରିୟ ଥର୍ମାଲ୍ ସିଲ୍ଡ",
      "availableFleet": "ଉପଲବ୍ଧ ଫ୍ଲିଟ୍",
      "terrainAccessibility": "ଭୂଖଣ୍ଡ ପ୍ରବେଶ",
      "allWeatherCapable": "ସମସ୍ତ ପାଗ ପାଇଁ ସକ୍ଷମ"
    },
    "shipments": {
      "sectionLabel": "ସିପମେଣ୍ଟ",
      "title": "ସିପମେଣ୍ଟ",
      "filters": {
        "all": "ସମସ୍ତ",
        "medicine": "ଔଷଧ",
        "produce": "ଉତ୍ପାଦ",
        "critical": "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ"
      },
      "tableHeaders": {
        "pickup": "ପିକଅପ୍",
        "producer": "ଉତ୍ପାଦକ",
        "classification": "ବର୍ଗୀକରଣ",
        "urgency": "ଜରୁରୀକାଳୀନ",
        "weight": "ଓଜନ",
        "waitTime": "ଅପେକ୍ଷା ସମୟ",
        "status": "ସ୍ଥିତି"
      },
      "form": {
        "title": "ନୂତନ ସିପମେଣ୍ଟ",
        "originLabel": "ମୂଳ",
        "destLabel": "ଗନ୍ତବ୍ୟସ୍ଥଳ",
        "producerLabel": "ଉତ୍ପାଦକ",
        "goodTypeLabel": "ସାମଗ୍ରୀ ପ୍ରକାର",
        "urgencyLabel": "ଜରୁରୀକାଳୀନ",
        "weightLabel": "ଓଜନ",
        "submit": "ଦାଖଲ କରନ୍ତୁ"
      }
    },
    "dispatch": {
      "sectionLabel": "ପ୍ରେରଣ",
      "title": "ଡିସ୍ପ୍ୟାଚ୍ ଇଞ୍ଜିନ୍",
      "windowToggle": "ୱିଣ୍ଡୋ ଟୋଗଲ୍",
      "enabled": "ସକ୍ଷମ",
      "disabled": "ଅକ୍ଷମ",
      "fairnessSummaryLabel": "ନିରପେକ୍ଷତା ସାରାଂଶ",
      "triggerDispatch": "ଟ୍ରିଗର୍ ଡିସ୍ପ୍ୟାଚ୍",
      "triggerButton": "ରନ୍",
      "computing": "ଗଣନା କରାଯାଉଛି...",
      "noMatches": "କୌଣସି ମ୍ୟାଚ୍ ମିଳିଲା ନାହିଁ",
      "clickToRun": "ରନ୍ କରିବାକୁ କ୍ଲିକ୍ କରନ୍ତୁ",
      "matchLabels": {
        "waitTime": "ଅପେକ୍ଷା ସମୟ",
        "fairnessBoost": "ନିରପେକ୍ଷତା ବୃଦ୍ଧି",
        "urgency": "ଜରୁରୀକାଳୀନ"
      },
      "transparentExplanation": "ସ୍ୱଚ୍ଛ ସ୍ପଷ୍ଟୀକରଣ"
    },
    "kinetics": {
      "sectionLabel": "କାଇନେଟିକ୍ସ",
      "title": "ନଷ୍ଟ କାଇନେଟିକ୍ସ",
      "activationEnergy": "ଆକ୍ଟିଭେସନ୍ ଶକ୍ତି",
      "ambientTemp": "ପରିବେଶ ତାପମାତ୍ରା",
      "transitDuration": "ପରିବହନ ଅବଧି",
      "solarBufferActive": "ସୌର ବଫର୍ ସକ୍ରିୟ",
      "solarDesc": "ସୌର ବର୍ଣ୍ଣନା",
      "solarOn": "ସୌର ଅନ୍",
      "gridOnly": "କେବଳ ଗ୍ରିଡ୍",
      "qualityLoss": "ଗୁଣବତ୍ତା ହ୍ରାସ",
      "minimalSpoilage": "ସର୍ବନିମ୍ନ ନଷ୍ଟ",
      "moderateLoad": "ମଧ୍ୟମ ଭାର",
      "criticalCooling": "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ କୁଲିଂ",
      "telemetryPings": "ଟେଲିମେଟ୍ରି ପିଙ୍ଗ୍ସ"
    },
    "fairness": {
      "sectionLabel": "ନିରପେକ୍ଷତା",
      "title": "ନିରପେକ୍ଷତା ମେଟ୍ରିକ୍ସ",
      "fairnessIndexLabel": "ନିରପେକ୍ଷତା ସୂଚକାଙ୍କ",
      "provable": "ପ୍ରମାଣଯୋଗ୍ୟ",
      "waitTimeDistribution": "ଅପେକ୍ଷା ସମୟ ବିତରଣ",
      "avgWait": "ହାରାହାରି ଅପେକ୍ଷା",
      "maxWait": "ସର୍ବାଧିକ ଅପେକ୍ଷା",
      "dispatches": "ଡିସ୍ପ୍ୟାଚ୍",
      "proofTitle": "ପ୍ରମାଣ",
      "proofDescription": "ପ୍ରମାଣ ବର୍ଣ୍ଣନା",
      "proofPoints": {
        "p1": "ପଏଣ୍ଟ 1",
        "p2": "ପଏଣ୍ଟ 2",
        "p3": "ପଏଣ୍ଟ 3"
      }
    },
    "alerts": {
      "sectionLabel": "ଆଲର୍ଟ",
      "title": "ଆଲର୍ଟ",
      "subtitle": "ସିଷ୍ଟମ୍ ଆଲର୍ଟ",
      "statuses": {
        "activeCaution": "ସକ୍ରିୟ ସତର୍କତା",
        "handled": "ପରିଚାଳିତ",
        "optimal": "ଉପଯୁକ୍ତ"
      }
    }
}
or_["about"] = {
    "breadcrumb": {
      "module": "ମଡ୍ୟୁଲ୍",
      "subtitle": "ଉପଶୀର୍ଷକ",
      "version": "ସଂସ୍କରଣ"
    },
    "hero": {
      "label": "ହିରୋ ଲେବଲ୍",
      "headline": "ମୁଖ୍ୟ ଖବର",
      "headlineBold": "ମୁଖ୍ୟ ଖବର ବୋଲ୍ଡ",
      "description": "ବର୍ଣ୍ଣନା"
    },
    "pillars": {
      "p1": {
        "label": "ଲେବଲ୍ 1",
        "title": "ଶୀର୍ଷକ 1",
        "description": "ବର୍ଣ୍ଣନା 1",
        "metric": "ମେଟ୍ରିକ୍ 1"
      },
      "p2": {
        "label": "ଲେବଲ୍ 2",
        "title": "ଶୀର୍ଷକ 2",
        "description": "ବର୍ଣ୍ଣନା 2",
        "metric": "ମେଟ୍ରିକ୍ 2"
      },
      "p3": {
        "label": "ଲେବଲ୍ 3",
        "title": "ଶୀର୍ଷକ 3",
        "description": "ବର୍ଣ୍ଣନା 3",
        "metric": "ମେଟ୍ରିକ୍ 3"
      }
    },
    "architecture": {
      "label": "ଆର୍କିଟେକ୍ଚର୍",
      "title": "ଆର୍କିଟେକ୍ଚର୍ ଶୀର୍ଷକ",
      "steps": {
        "s01": {
          "title": "ଷ୍ଟେପ୍ 1",
          "description": "ବର୍ଣ୍ଣନା 1"
        },
        "s02": {
          "title": "ଷ୍ଟେପ୍ 2",
          "description": "ବର୍ଣ୍ଣନା 2"
        },
        "s03": {
          "title": "ଷ୍ଟେପ୍ 3",
          "description": "ବର୍ଣ୍ଣନା 3"
        },
        "s04": {
          "title": "ଷ୍ଟେପ୍ 4",
          "description": "ବର୍ଣ୍ଣନା 4"
        }
      }
    },
    "form": {
      "label": "ଫର୍ମ ଲେବଲ୍",
      "headline": "ଫର୍ମ ହେଡଲାଇନ୍",
      "headlineBold": "ଫର୍ମ ହେଡଲାଇନ୍ ବୋଲ୍ଡ",
      "description": "ଫର୍ମ ବର୍ଣ୍ଣନା",
      "fields": {
        "name": "ନାମ",
        "email": "ଇମେଲ୍",
        "cluster": "କ୍ଲଷ୍ଟର"
      },
      "placeholders": {
        "name": "ନାମ",
        "email": "ଇମେଲ୍",
        "cluster": "କ୍ଲଷ୍ଟର"
      },
      "submit": "ଦାଖଲ କରନ୍ତୁ",
      "transmitLabel": "ପ୍ରେରଣ କରନ୍ତୁ",
      "success": {
        "title": "ସଫଳତା",
        "description": "ସଫଳତା ବର୍ଣ୍ଣନା"
      }
    }
}
or_["ai"] = {
    "breadcrumb": {
      "module": "AI",
      "subtitle": "AI ଇଣ୍ଟେଲିଜେନ୍ସ"
    },
    "status": {
      "latency": "ଲାଟେନ୍ସି",
      "fairnessIndex": "ନିରପେକ୍ଷତା ସୂଚକାଙ୍କ"
    },
    "header": {
      "label": "ହେଡର୍ ଲେବଲ୍",
      "title": "ହେଡର୍ ଶୀର୍ଷକ",
      "titleBold": "ହେଡର୍ ଶୀର୍ଷକ ବୋଲ୍ଡ"
    },
    "buttons": {
      "runSolver": "ସଲଭର୍ ରନ୍ କରନ୍ତୁ",
      "running": "ରନ୍ ହେଉଛି"
    },
    "params": {
      "corridor": "କରିଡର",
      "goodType": "ସାମଗ୍ରୀ ପ୍ରକାର",
      "vehicleType": "ଯାନ ପ୍ରକାର",
      "waitTime": "ଅପେକ୍ଷା ସମୟ",
      "ambientTemp": "ପରିବେଶ ତାପମାତ୍ରା",
      "goodTypes": {
        "farmProduce": "କୃଷି ଉତ୍ପାଦ",
        "medicine": "ଔଷଧ",
        "essentialGoods": "ଅତ୍ୟାବଶ୍ୟକ ସାମଗ୍ରୀ"
      },
      "goodTypeSubs": {
        "farmProduce": "କୃଷି ଉତ୍ପାଦ ସବ୍",
        "medicine": "ଔଷଧ ସବ୍",
        "essentialGoods": "ଅତ୍ୟାବଶ୍ୟକ ସାମଗ୍ରୀ ସବ୍"
      },
      "vehicles": {
        "tempo": "ଟେମ୍ପୋ",
        "tractor": "ଟ୍ରାକ୍ଟର",
        "auto": "ଅଟୋ",
        "motorbike": "ମୋଟରବାଇକ୍"
      },
      "waitLabels": {
        "fresh": "ତାଜା",
        "regionalAvg": "ଆଞ୍ଚଳିକ ହାରାହାରି",
        "starvationRisk": "ଭୋକିଲା ବିପଦ"
      },
      "nominal": "ନାମମାତ୍ର",
      "aboveBaseline": "ବେସଲାଇନ୍ ଉପରେ"
    },
    "metrics": {
      "dispatchScore": "ଡିସ୍ପ୍ୟାଚ୍ ସ୍କୋର୍",
      "highPriority": "ଉଚ୍ଚ ପ୍ରାଥମିକତା",
      "fairnessBoost": "ନିରପେକ୍ଷତା ବୃଦ୍ଧି",
      "waitTimeEquity": "ଅପେକ୍ଷା ସମୟ ଇକ୍ୱିଟି",
      "perishableDecay": "ନଷ୍ଟ ହେବା କ୍ଷୟ",
      "arrheniusSpoilage": "Arrhenius ନଷ୍ଟ",
      "effectiveTransit": "ପ୍ରଭାବଶାଳୀ ପରିବହନ",
      "terrainAdjusted": "ଭୂଖଣ୍ଡ ସମନ୍ୱୟ"
    },
    "attribution": {
      "label": "ଆଟ୍ରିବ୍ୟୁସନ୍",
      "title": "ଆଟ୍ରିବ୍ୟୁସନ୍ ଶୀର୍ଷକ",
      "shapley": "SHAP",
      "spoilageRisk": "ନଷ୍ଟ ହେବା ବିପଦ",
      "medicineSafeguard": "ଔଷଧ ସୁରକ୍ଷା",
      "fairnessDisparity": "ନିରପେକ୍ଷତା ଅସମାନତା",
      "terrainCompatibility": "ଭୂଖଣ୍ଡ ସୁସଙ୍ଗତତା",
      "vehiclePayload": "ଯାନ ପେଲୋଡ୍"
    },
    "synthesis": {
      "title": "ସିନ୍ଥେସିସ୍",
      "dispatchDecision": "ଡିସ୍ପ୍ୟାଚ୍ ନିଷ୍ପତ୍ତି",
      "whyThisVehicle": "କାହିଁକି ଏହି ଯାନ"
    }
}
or_["common"] = {
    "goodTypes": {
      "farmProduce": "କୃଷି ଉତ୍ପାଦ",
      "medicine": "ଔଷଧ",
      "essentialGoods": "ଅତ୍ୟାବଶ୍ୟକ ସାମଗ୍ରୀ"
    },
    "urgency": {
      "critical": "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ",
      "high": "ଉଚ୍ଚ",
      "routine": "ନିୟମିତ",
      "criticalImmediate": "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ତୁରନ୍ତ",
      "highPriority": "ଉଚ୍ଚ ପ୍ରାଥମିକତା",
      "routineBatch": "ନିୟମିତ ବ୍ୟାଚ୍"
    },
    "status": {
      "pending": "ବକେୟା ଅଛି",
      "dispatched": "ପଠାଯାଇଛି",
      "inTransit": "ରାସ୍ତାରେ ଅଛି",
      "delivered": "ପହଞ୍ଚିଛି"
    },
    "terrain": {
      "paved": "ପକ୍କା",
      "unpaved": "କଚ୍ଚା",
      "seasonal": "ଋତୁକାଳୀନ",
      "floodRisk": "ବନ୍ୟା ବିପଦ"
    },
    "power": {
      "solar": "ସୌର",
      "unreliable": "ଅବିଶ୍ୱସନୀୟ",
      "grid": "ଗ୍ରିଡ୍"
    },
    "riskStatus": {
      "optimal": "ଉପଯୁକ୍ତ",
      "moderate": "ମଧ୍ୟମ",
      "constrained": "ସୀମିତ"
    },
    "units": {
      "kg": "କେଜି",
      "celsius": "°C",
      "hours": "ଘଣ୍ଟା",
      "minutes": "ମିନିଟ୍",
      "cubicMeters": "m³",
      "pts": "pts"
    }
}
or_["search"] = {
    "title": "ଖୋଜନ୍ତୁ",
    "placeholder": "ଖୋଜନ୍ତୁ...",
    "noResults": "କୌଣସି ଫଳାଫଳ ମିଳିଲା ନାହିଁ"
}
or_["languageSwitcher"] = en["languageSwitcher"]

with open(f"{messages_dir}/en.json", "w") as f:
    json.dump(en, f, indent=2, ensure_ascii=False)
with open(f"{messages_dir}/hi.json", "w") as f:
    json.dump(hi, f, indent=2, ensure_ascii=False)
with open(f"{messages_dir}/or.json", "w") as f:
    json.dump(or_, f, indent=2, ensure_ascii=False)
