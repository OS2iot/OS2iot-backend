pipeline {
  agent { dockerfile true }
  environment {
    HOME = '.'
  }
  stages {
    stage('Run eslint') {
      steps {
        sh 'npm install'
        sh 'npm run lint'
      }
    }
    stage('Run Jest') {
      steps {
        sh 'npm run test'
      }
      post {
        always {
          step([$class: 'CoberturaPublisher', coberturaReportFile: 'output/coverage/jest/cobertura-coverage.xml'])
        }
      }
    }
  }
}
