# Smart-Environmental-Greenhouse-Automation-Hub

## Smart Greenhouse IoT System: Short Project Description

The Autonomous IoT Smart Greenhouse System is an advanced, fault-tolerant agricultural automation platform built around the ESP32-D0WD-V3 microcontroller. It provides real-time environmental monitoring, intelligent closed-loop automation, and dual-mode control (local web dashboard and AI voice commands) to optimize plant growth while minimizing resource waste.

### Key System Highlights

- **Microclimate & Sensor Suite:** Continuously monitors air temperature and humidity (DHT11/DHT22), ambient sunlight in lux (BH1750), dual-zone root moisture (Capacitive Soil Probes), air quality (MQ-135), rainfall (FC-37), and perimeter security (PIR Motion).
- **Autonomous Actuator Control:** Automatically regulates an exhaust fan for ventilation (>30°C), supplemental LED grow lights (<200 lux), and a submersible irrigation pump governed by soil dryness, tank water levels, and weather rain lockouts.
- **4-Probe Water Reservoir Array:** Utilizes 4x BC547 NPN transistors and conductive depth probes (25%, 50%, 75%, 100%) to prevent dry-run pump damage and signal tank overflow alerts.
- **Widescreen 3D Web OS & AI Voice Control:** Broadcasts a responsive glassmorphic 3D web dashboard at [http://10.193.101.104](http://10.193.101.104) (and AP mode 192.168.4.1) featuring live JSON telemetry polling, an interactive digital twin, and browser Web Speech API (STT/TTS) voice commands ("Turn on grow light", "Status report").
- **Robust Hardware Architecture:** Incorporates strict strapping pin isolation (GPIO 6–11, 0, 2, 12, 15) to eliminate upload errors (C100 checksum failures), dual-rail power isolation with an off-grid solar photovoltaic option, and automated Gmail SMTP HTML alerts.
