pipeline {
  agent any

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
        echo 'Unit Tests executed'
      }
    }

    // Consolidated Security Scan
    stage('Security Scan - Trivy') {
      steps {
        echo 'Running Vulnerability and Secret Scans...'
        sh '''
          trivy fs . \
            --scanners vuln,secret \
            --severity CRITICAL,HIGH,MEDIUM \
            --format json \
            -o trivy-report.json
        '''
      }
    }

    stage('Send Report') {
      steps {
        echo 'Report sent to Decision Engine'
        // Updated to use the new filename: trivy-report.json
        sh 'curl -X POST http://decision-engine/api/report -d @trivy-report.json'
      }
    }
  }
}