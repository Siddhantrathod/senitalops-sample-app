pipeline {
  agent any

  tools {
    nodejs 'node22'
  }

  environment {
    SECURITY_DECISION = ''
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
          ./trivy fs . \
            --scanners vuln,secret \
            --severity CRITICAL,HIGH,MEDIUM \
            --format json \
            -o trivy-report.json
        '''
      }
    }

    stage('Security Decision Engine') {
      steps {
        script {
          dir('Decision-engine') {
            sh 'npm install'

            // Start decision engine in background and store PID
            sh 'nohup node index.js > decision-engine.log 2>&1 & echo $! > decision-engine.pid'
          }

          // Wait until service is actually ready
          sh '''
            for i in {1..10}; do
              curl -sf http://localhost:4000/evaluate && break
              sleep 1
            done
          '''

          // Call API and save response
          sh '''
            curl -s -X POST http://localhost:4000/evaluate \
              -H "Content-Type: application/json" \
              --data @trivy-report.json \
              -o decision.json
          '''

          // Safety check
          sh 'cat decision.json'
        }
      }
    }

    stage('Policy Enforcement') {
      steps {
        script {
          def report = readJSON file: 'decision.json'

          env.SECURITY_DECISION = report.decision

          echo "Decision: ${env.SECURITY_DECISION} | Score: ${report.security_score}"
          echo "Stats: Critical=${report.stats.critical}, High=${report.stats.high}, Medium=${report.stats.medium}"

          if (env.SECURITY_DECISION != 'APPROVED') {
            error "Pipeline halted: Security policy not met (${env.SECURITY_DECISION})"
          }
        }
      }
    }

    stage('Deploy') {
      when {
        expression { env.SECURITY_DECISION == 'APPROVED' }
      }
      steps {
        echo "✅ Deploying application securely..."
      }
    }
  }

  post {
    always {
      echo 'Cleaning up Decision Engine...'
      sh '''
        if [ -f Decision-engine/decision-engine.pid ]; then
          kill $(cat Decision-engine/decision-engine.pid) || true
        fi
      '''
    }
  }
}
