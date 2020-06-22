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
  }
}
