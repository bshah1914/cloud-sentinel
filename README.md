# CloudSentrix v3.0

**Enterprise Multi-Cloud Security Platform**

CloudSentrix is a comprehensive cloud security platform for monitoring, auditing, and protecting AWS, Azure, and GCP infrastructure from a single dashboard.

## Features

- **Multi-Cloud Scanning** — Discover all resources across AWS, Azure, GCP
- **Security Audit** — Detect misconfigurations, open ports, public exposure
- **IAM Analysis** — Review users, roles, policies, MFA status
- **Security Groups** — Identify risky firewall rules open to the world
- **Compliance** — 10 frameworks (CIS, NIST, SOC2, ISO 27001, PCI-DSS, HIPAA, GDPR)
- **Threat Detection** — MITRE ATT&CK mapping, attack path analysis, secret detection
- **AI Security Assistant** — AI-powered analysis of your cloud infrastructure
- **Reports** — Export as PDF, Excel, CSV, JSON
- **Multi-Account** — Onboard and manage multiple cloud accounts
- **Command Palette** — Ctrl+K for fast navigation
- **Notification Center** — Real-time security alerts

---

## Deployment Guide

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Python | 3.11+ |
| Node.js | 20+ |
| npm | 9+ |
| Nginx | any |

### Step 1: Clone the Repository

```bash
git clone https://github.com/bshah1914/cloud-sentinel-production.git
cd cloud-sentinel-production
```

### Step 2: Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 4: Configure Nginx

Create `/etc/nginx/sites-available/cloudsentrix`:

```nginx
server {
    listen 7070;
    server_name _;

    root /path/to/cloud-sentinel-production/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/cloudsentrix /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Step 5: Start the Backend

```bash
cd backend
source ../venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8088
```

For production, run in background:

```bash
nohup uvicorn app:app --host 0.0.0.0 --port 8088 > /tmp/cloudsentrix.log 2>&1 &
```

### Step 6: Access the Application

- **URL:** `http://your-server-ip:7070`
- **Username:** `admin`
- **Password:** `admin123`

### Docker Deployment (Alternative)

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## User Guide

### 1. Login

Navigate to your deployment URL and log in with the default credentials. Change the password after first login.

### 2. Onboard a Cloud Account

1. Go to **Accounts** from the sidebar
2. Click **+ Add Account**
3. Select provider (AWS / Azure / GCP)
4. Enter your **Account ID** and **Account Name**
5. Enter credentials:
   - **AWS:** Access Key ID + Secret Access Key (optionally a Role ARN)
   - **Azure:** Tenant ID, Client ID, Client Secret, Subscription ID
   - **GCP:** Project ID + Service Account JSON key
6. Click **Validate & Connect** — credentials are verified before saving

**AWS IAM Permissions Required:**
The IAM user/role needs `ReadOnlyAccess` policy or at minimum these permissions:
- `ec2:Describe*`
- `s3:ListBuckets`, `s3:GetBucketAcl`
- `iam:GetAccountSummary`, `iam:ListUsers`, `iam:ListMFADevices`, `iam:GetAccountAuthorizationDetails`
- `lambda:ListFunctions`
- `rds:DescribeDBInstances`
- `elasticloadbalancing:DescribeLoadBalancers`
- `cloudtrail:DescribeTrails`
- `guardduty:ListDetectors`
- `sts:GetCallerIdentity`

### 3. Run a Scan

1. Go to **Scans** from the sidebar
2. Select the account to scan
3. Click **Start Scan**
4. Wait for the scan to complete (typically 2-5 minutes for all 17 AWS regions)
5. Once complete, all dashboards populate automatically

### 4. View Dashboards

| Page | Description |
|------|-------------|
| **Overview** | Executive summary across all accounts — resource distribution, security score, quick actions |
| **Dashboard** | Detailed per-account view — public IPs, resource breakdown by region, security radar, IAM overview |
| **Resources** | Browse all collected resources — EC2, S3, Security Groups, VPCs, Lambda, RDS, ELBs |
| **IAM** | Users, roles, policies with MFA status |
| **Security** | Risky security groups open to 0.0.0.0/0 with severity ratings |
| **Threats** | MITRE ATT&CK mapped threats, attack paths |
| **Audit** | Run security audits and view findings by severity |
| **Compliance** | Run compliance checks against CIS, NIST, SOC2, PCI-DSS, HIPAA, etc. |

### 5. Run Security Audit

1. Go to **Audit** from the sidebar
2. Click **Run Audit** — analyzes all collected data for misconfigurations
3. View findings grouped by severity (Critical, High, Medium, Low)
4. Each finding includes remediation steps and CLI commands
5. Click **Request Fix** on any finding to submit a remediation request

### 6. Remediation Center (Owner Approval)

All remediation actions require **owner approval** before execution:

1. Any user can click **Request Fix** on findings (Audit or Threats page)
2. Request appears in **Remediation Center** with "Pending Approval" status
3. **Owner reviews** the request and clicks **Approve** or **Reject** (with reason)
4. After approval, owner clicks **Execute** to run the fix via AWS SDK
5. System executes the remediation and shows success/failure result

**Flow:** Request → Owner Review → Approve/Reject → Execute → Verify

Supported auto-remediation actions:
- Close open Security Group rules (0.0.0.0/0)
- Disable RDS public access
- Enable S3 bucket encryption
- Enable GuardDuty threat detection

### 7. Export Reports

From the **Dashboard** or **Report** page:
- Click the **Export** button
- Choose format: **PDF**, **Excel**, **CSV**, or **JSON**
- Report includes all findings, resource inventory, IAM analysis, and AI recommendations

### 8. Multi-Account Management

- Onboard multiple AWS/Azure/GCP accounts
- Switch between accounts using the **dropdown** at the top of the page
- Each account has independent scan data and findings
- Overview page aggregates across all accounts

### 9. Account Offboarding

1. Go to **Accounts**
2. Click the **trash icon** on the account card
3. Confirm deletion — all scan data for that account is permanently removed

---

## Architecture

```
                    ┌──────────────┐
                    │   Browser    │
                    └──────┬───────┘
                           │ :7070
                    ┌──────┴───────┐
                    │    Nginx     │
                    └──┬───────┬───┘
            static /   │       │  /api/
        ┌──────────────┘       └──────────────┐
        │                                     │
┌───────┴────────┐                  ┌─────────┴────────┐
│  React Frontend │                  │  FastAPI Backend  │
│  (Vite build)   │                  │  (Uvicorn :8088)  │
└────────────────┘                  └────────┬─────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                        ┌─────┴─────┐  ┌─────┴─────┐  ┌────┴────┐
                        │  SQLite   │  │  AWS API  │  │  Files  │
                        │ (accounts │  │  (boto3)  │  │ account │
                        │  scans,   │  │           │  │  -data/ │
                        │  findings)│  │           │  │         │
                        └───────────┘  └───────────┘  └─────────┘
```

## Tech Stack

- **Frontend:** React 19, Tailwind CSS, Recharts, Framer Motion
- **Backend:** Python FastAPI, Uvicorn
- **Database:** SQLite (auto-created on first run)
- **Cloud SDKs:** Boto3 (AWS), Azure SDK, Google Cloud SDK
- **Auth:** JWT + bcrypt
- **Reports:** ReportLab (PDF), OpenPyXL (Excel)

## Security Notes

- Never commit `cloudsentrix.db` — it contains encrypted credentials
- AWS credentials are stored in the database, not in config files
- The `.gitignore` excludes sensitive files: DB, logs, account-data, config.json
- Change the default JWT secret key in production (`SECRET_KEY` in app.py)
- Change the default admin password after first login

## License

BSD 2-Clause License
