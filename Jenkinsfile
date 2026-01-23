pipeline {
  agent any

  tools {
    nodejs 'node22' // Using LTS for stability
  }

  // Define a variable at the top level to share the decision between stages
  environment {
    SECURITY_DECISION = ""
  }

  stages {
    stage('Build') {
      steps {
        sh 'npm install'
      }
    }

    stage('Security Scan - Trivy') {
      steps {
        sh '''
          curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b . v0.49.1
          ./trivy fs . --scanners vuln,secret --severity CRITICAL,HIGH,MEDIUM --format json -o trivy-report.json
        '''
      }
    }

    stage('Security Decision Engine') {
      steps {
        script {
          dir('Decision-engine') {
            sh 'npm install'
            sh 'node index.js &' 
            sh 'sleep 5'
          }
          // Save result to a file
          sh 'curl -X POST http://localhost:4000/evaluate -H "Content-Type: application/json" --data @trivy-report.json > decision.json'
        }
      }
    }

    stage('Policy Enforcement') {
      steps {
        script {
          def report = readJSON file: 'decision.json'
          // Store decision in the environment variable
          env.SECURITY_DECISION = report.decision
          
          echo "Decision: ${env.SECURITY_DECISION} | Score: ${report.security_score}"

          if (env.SECURITY_DECISION != 'APPROVED') {
            error "Pipeline halted: Security policy not met (${env.SECURITY_DECISION})"
          }
        }
      }
    }

    stage('Deploy') {
      when {
        // Use the variable we set in the previous stage instead of 'jq'
        expression { env.SECURITY_DECISION == 'APPROVED' }
      }
      steps {
        echo "✅ Deploying application securely..."
      }
    }
  }

  post {
    always {
      // Kill the Decision Engine so port 4000 is free for the next run
      echo 'Cleaning up background processes...'
      sh 'pkill -f "node index.js" || true'
    }
  }
}