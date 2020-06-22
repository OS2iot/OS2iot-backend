pipeline {
  agent { dockerfile true }
  stages {
    stage('Run eslint') {
      steps {
        sh 'npm install -g eslint '
        sh 'npm install'
        sh 'npm run lint'
      }
    }
  }
}
