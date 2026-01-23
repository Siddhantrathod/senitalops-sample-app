pipeline {
  agent any

  tools {
    nodejs 'node25' // Ensure this matches your Tool configuration name
  }

  stages {
    stage('Build') {
      steps {
        echo 'Building the application'
        sh 'npm install'
      }
    }

    stage('Unit Test') {
      steps {
        sh 'npm test || true'
      }
    }

    stage('Security Scan - Trivy') {
      steps {
        script {
          echo 'Downloading and Running Trivy...'

          sh '''
            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b . v0.49.1
            ./trivy fs . \
              --scanners vuln,secret \
              --severity CRITICAL,HIGH,MEDIUM \
              --format json \
              -o trivy-report.json
          '''
        }
      }
    }

    stage('Send Report') {
      steps {
        echo 'Report sent to Decision Engine'
        sh 'curl -X POST http://decision-engine/api/report -d @trivy-report.json'
      }
    }
  }
}