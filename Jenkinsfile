
import groovy.json.JsonSlurper 

pipeline {
  agent any

  tools {
    // Ensure this matches the name in Manage Jenkins > Tools
    nodejs 'node25' 
  }

  environment {
    // We define this variable to pass the result to the Deploy stage
    SECURITY_DECISION = ""
  }

  stages {
    stage('Build') {
      steps {
        echo 'Building the application...'
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
          // 1. Download Trivy locally
          // 2. Run scan and output to trivy-report.json
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
        script {
          echo 'Starting Decision Engine...'
          
          // 1. Start the engine in the background
          // We use 'nohup' to ensure it keeps running for the curl command
          dir('Decision-engine') {
            sh 'npm install'
            sh 'nohup node index.js > engine.log 2>&1 &'
            sh 'echo $! > decision-engine.pid' // Save PID to kill it later
            sh 'sleep 5' // Wait for boot
          }

          // 2. Send the report and save the response to decision.json
          // We use -s (silent) but show errors, and output to file
          sh '''
            curl -X POST http://localhost:4000/evaluate \
              -H "Content-Type: application/json" \
              --data @trivy-report.json \
              -o decision.json
          '''
          
          // Debugging: Show us what the file actually contains
          sh 'cat decision.json' 
        }
      }
    }

    stage('Policy Enforcement') {
      steps {
        script {
          def decisionFile = new File("${workspace}/decision.json")
          
          if (decisionFile.exists()) {
            def report = new JsonSlurper().parseText(decisionFile.text)
            
            // Capture the decision locally
            def decisionVal = report.decision
            def scoreVal = report.security_score
            
            // Set the environment variable for the next stage
            env.SECURITY_DECISION = decisionVal
            
            echo "----------------------------------------"
            echo "🛡️ Security Score: ${scoreVal}"
            echo "🛡️ Decision: ${decisionVal}"
            echo "----------------------------------------"

            if (decisionVal != 'APPROVED') {
              error "❌ Pipeline halted: Security policy was not met."
            }
          } else {
            error "❌ decision.json not found! The engine failed to respond."
          }
        }
      }
    }

    stage('Deploy') {
      when {
        // Only run if the previous stage set this to APPROVED
        expression { env.SECURITY_DECISION == 'APPROVED' }
      }
      steps {
        echo "✅ Policy Met. Deploying application..."
        sh 'echo "Deployment Successful!"'
      }
    }
  }

  post {
    always {
      script {
        echo 'Cleaning up background processes...'
        // Check if PID file exists and kill the process
        if (fileExists('Decision-engine/decision-engine.pid')) {
           dir('Decision-engine') {
             sh 'kill $(cat decision-engine.pid) || true'
             sh 'rm decision-engine.pid'
           }
        }
        // Fallback cleanup to ensure port 4000 is free
        sh 'pkill -f "node index.js" || true'
      }
    }
  }
}