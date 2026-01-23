pipeline {
  agent any

  tools {
    nodejs 'node25'   // must exist in Jenkins tool config
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

    stage('Security Decision Engine') {
      steps {
        echo 'Sending report to Decision Engine'
        sh '''
          curl -X POST http://localhost:4000/evaluate \
          -H "Content-Type: application/json" \
          --data @trivy-report.json > decision.json
        '''
      }
    }

    stage('Policy Enforcement') {
      steps {
        script {
          sh '''
            decision=$(cat decision.json | jq -r .decision)
            score=$(cat decision.json | jq -r .security_score)

            echo "=============================="
            echo "Security Score: $score"
            echo "Decision: $decision"
            echo "=============================="

            if [ "$decision" = "BLOCKED" ]; then
              echo "❌ Deployment Blocked by Security Policy"
              exit 1
            fi
          '''
        }
      }
    }

    stage('Deploy') {
      when {
        expression {
          return sh(
            script: "jq -r .decision decision.json",
            returnStdout: true
          ).trim() == "APPROVED"
        }
      }
      steps {
        echo "✅ Deploying application securely..."
        sh 'echo Deployment Successful'
      }
    }

  }
}
