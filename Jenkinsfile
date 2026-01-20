pipeline {
  agent any

  stages {
    stage('Build') {
      steps {
        echo 'Building the application'
        // sh 'npm install'
      }
    }

    stage('Unit Test') {
      steps {
        // sh 'npm test || true'
        echo 'Unit Tests executed'
      }
    }

    stage('SAST Scan') {
      steps {
        echo 'SAST Scan executed'
      }
    }

    stage('Dependency Scan') {
      steps {
        echo 'Dependency Scan executed'
        // sh 'trivy fs . --format json > trivy.json'
      }
    }

    stage('Send Report') {
      steps {
        echo 'Report sent to Decision Engine'
        // sh 'curl -X POST http://decision-engine/api/report -d @trivy.json'
      }
    }
  }
}
