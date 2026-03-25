# Puppet Manifest — AlertPulse Alert Fatigue Reducer
# Installs and configures all required dependencies

class alertpulse {

  # ── System packages ──────────────────────────────────
  package { ['curl', 'git', 'wget', 'unzip']:
    ensure => installed,
  }

  # ── Python 3.11 ──────────────────────────────────────
  package { 'python3.11':
    ensure => installed,
  }

  package { 'python3-pip':
    ensure => installed,
    require => Package['python3.11'],
  }

  # ── Node.js 20 ───────────────────────────────────────
  exec { 'install-nodejs':
    command => 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs',
    path    => ['/usr/bin', '/bin', '/usr/local/bin'],
    unless  => 'which node',
  }

  # ── Docker ───────────────────────────────────────────
  exec { 'install-docker':
    command => 'curl -fsSL https://get.docker.com | sh',
    path    => ['/usr/bin', '/bin'],
    unless  => 'which docker',
  }

  service { 'docker':
    ensure  => running,
    enable  => true,
    require => Exec['install-docker'],
  }

  # ── Project directory ────────────────────────────────
  file { '/opt/alertpulse':
    ensure => directory,
    owner  => 'root',
    group  => 'root',
    mode   => '0755',
  }

  # ── Environment file ─────────────────────────────────
  file { '/opt/alertpulse/.env':
    ensure  => file,
    owner   => 'root',
    mode    => '0600',
    content => @("ENV"),
      DATABASE_URL=sqlite+aiosqlite:///./alerts.db
      DEMO_ENABLED=true
      DEMO_ALERT_INTERVAL=3.0
      ALERT_CORRELATION_WINDOW=300
      ALERT_SUPPRESSION_DURATION=3600
      | ENV
    require => File['/opt/alertpulse'],
  }

  # ── Systemd service for backend ──────────────────────
  file { '/etc/systemd/system/alertpulse-backend.service':
    ensure  => file,
    content => @("SERVICE"),
      [Unit]
      Description=AlertPulse Backend
      After=network.target

      [Service]
      Type=simple
      WorkingDirectory=/opt/alertpulse/backend
      ExecStart=/opt/alertpulse/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
      Restart=always
      RestartSec=5

      [Install]
      WantedBy=multi-user.target
      | SERVICE
  }

  service { 'alertpulse-backend':
    ensure  => running,
    enable  => true,
    require => File['/etc/systemd/system/alertpulse-backend.service'],
  }

  # ── Firewall rules ───────────────────────────────────
  exec { 'open-port-3000':
    command => 'ufw allow 3000/tcp',
    path    => ['/usr/sbin', '/usr/bin'],
    onlyif  => 'which ufw',
  }

  exec { 'open-port-8000':
    command => 'ufw allow 8000/tcp',
    path    => ['/usr/sbin', '/usr/bin'],
    onlyif  => 'which ufw',
  }

  exec { 'open-port-9090':
    command => 'ufw allow 9090/tcp',
    path    => ['/usr/sbin', '/usr/bin'],
    onlyif  => 'which ufw',
  }

  exec { 'open-port-3001':
    command => 'ufw allow 3001/tcp',
    path    => ['/usr/sbin', '/usr/bin'],
    onlyif  => 'which ufw',
  }
}

include alertpulse
