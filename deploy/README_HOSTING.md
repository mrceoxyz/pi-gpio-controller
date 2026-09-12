# Hosting PiGPIO Web Controller on your Raspberry Pi

Access this web dashboard from any smartphone, tablet, laptop, or smart device connected to your home Wi-Fi network.

---

## 1. Quick Start on your Raspberry Pi

### A. Copy or Clone the code to your Pi
If you develop on your PC and push to GitHub, or use `rsync`/`scp`:
```bash
# On your Pi:
cd ~/sandbox
git clone git@github.com:mrceoxyz/pi-gpio-controller.git
cd pi-gpio-controller
```

### B. Install Dependencies & Build
```bash
pnpm install
pnpm build
```

### C. Run the Server
```bash
pnpm start
```
By default, the server binds to `0.0.0.0:3000`, making it accessible on the local network.

---

## 2. Accessing from your Phone, Tablet, or Laptop

1. **Find your Raspberry Pi's Local IP Address**:
   On your Pi terminal, run:
   ```bash
   hostname -I
   ```
   *(Example output: `192.168.1.45`)*

2. **Open in any browser**:
   On your phone, tablet, or laptop (must be on the same home Wi-Fi):
   - `http://192.168.1.45:3000` (replace with your Pi's actual IP)
   - Or using mDNS hostname: `http://raspberrypi.local:3000`

---

## 3. Keep it Running 24/7 (Auto-start on Boot)

Choose either **PM2** (easiest) or **systemd** (native Linux service):

### Option A: Using PM2 (Recommended & Simple)
1. Install PM2:
   ```bash
   sudo npm install -g pm2
   ```
2. Start the application:
   ```bash
   cd ~/sandbox/pi-gpio-controller
   pm2 start "pnpm start" --name "pi-gpio"
   ```
3. Configure PM2 to restart on reboot:
   ```bash
   pm2 startup
   pm2 save
   ```

### Option B: Using systemd (Built-in Linux Service)
1. Copy the service file:
   ```bash
   sudo cp deploy/pi-gpio.service /etc/systemd/system/
   ```
2. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable pi-gpio.service
   sudo systemctl start pi-gpio.service
   ```
3. Check status:
   ```bash
   sudo systemctl status pi-gpio.service
   ```

---

## 4. Hardware Pinout Quick Reference

| Pin # (Board) | BCM GPIO | Typical Usage | Notes |
|:---:|:---:|:---:|:---|
| **Pin 11** | GPIO 17 | LED 1 / Output | Default Main LED 1 |
| **Pin 13** | GPIO 27 | LED 2 / Output | Default Main LED 2 |
| **Pin 15** | GPIO 22 | LED 3 / Output | Default Main LED 3 |
| **Pin 18** | GPIO 24 | Sensor / Input | Trigger Pin |
| **Pin 12** | GPIO 18 | PWM Output | Hardware PWM |
| **Pin 6, 9, 14, 20, 25, 30, 34, 39** | Ground | 0V | Common Ground |
| **Pin 1, 17** | 3.3V | Power Rail | 3.3 Volts |
| **Pin 2, 4** | 5.0V | Power Rail | 5.0 Volts |
