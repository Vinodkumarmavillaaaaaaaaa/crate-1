module.exports = {
  root: true,
  extends: '@react-native-community',
};
-----------------------------------------------------------------------------------------------
  pipeline {
   agent { label 'cicada-automation-node' }  
   //environment {
   //     path ='/home/centos/workspace/CICADA/Regression/Cluster-Health-Status-Dev'
   //    
   //}
   parameters {
            string defaultValue: '1.2.3.4', description: 'Cluster primary master ip', name: 'MASTER_IP', trim: false
            string defaultValue: 'centos', description: 'Primary master login user name', name: 'USERNAME', trim: false
            string defaultValue: 'cicada', description: 'Primary master login password', name: 'PASSWORD', trim: false
            string defaultValue: 'master', description: 'Branch Name', name: 'BRANCH', trim: false
            text defaultValue: '', description: 'Private key', name: 'PKEY', trim: false
        }
   stages {
        
       stage('git checkout of cicada repo') {
            steps {
	    	 	   
	    	 	   checkout([$class: 'GitSCM', branches: [[name: "${BRANCH}"]], extensions: [[
                      $class: 'RelativeTargetDirectory',
                            relativeTargetDir: "automation"]], 
                            userRemoteConfigs: [[credentialsId: '00313e2a-6b4b-4bbe-bbc3-9fdc84b98ee9', url: 'https://bitbucket.fnc.fujitsu.com/scm/cicfwk/automation.git']]])
            }
        } 
	     stage('Install Modules') {
            steps {
                script{
                    
                    if ( PKEY){
                        sh """
                            ls -la 
                            echo "${PKEY}" > automation/keyfile.pem
                            chmod 600 automation/keyfile.pem
                            sshpass ssh -i automation/keyfile.pem "${MASTER_IP}" -l "${USERNAME}" -o StrictHostKeyChecking=no "rm -rf /tmp/robot;mkdir -p /tmp/robot" 
                            sshpass scp -i automation/keyfile.pem  -r automation ${USERNAME}@${MASTER_IP}:/tmp/robot/
                            sshpass ssh -i automation/keyfile.pem "${master_ip}" -l "${USERNAME}" -o StrictHostKeyChecking=no  "source py3/bin/activate;cd /tmp/robot/automation; python3 -m pip install -r requirements.txt"
                        """
                        
                    }
                    else if(PASSWORD){
                        sh """
                            sshpass -p "${PASSWORD}" ssh  "${PRIMARY_MASTER_IP}" -l "${USERNAME}" -o StrictHostKeyChecking=no "rm -rf /tmp/robot;mkdir -p /tmp/robot"
                            sshpass -p "${PASSWORD}" scp -r automation ${USERNAME}@${PRIMARY_MASTER_IP}:/tmp/robot/
                            sshpass -p "${PASSWORD}" ssh  "${master_ip}" -l "${USERNAME}" -o StrictHostKeyChecking=no "source py3/bin/activate;cd /tmp/robot/automation; python3 -m pip install -r requirements.txt"
                        """
                        
                    }
                }
            }
            
        }
       stage('running robot test cases'){
           steps{
                script{
                    
                    if ( PKEY){
                        sh '''
                        sshpass ssh -i automation/keyfile.pem "${MASTER_IP}" -l "${USERNAME}" -o StrictHostKeyChecking=no "export PATH=${path}:/var/lib/rancher/rke2/bin/;export PYTHONPATH=/tmp/robot/automation;source py3/bin/activate; cd /tmp/robot/automation; python3 -m robot tests/system/rke2/rke2-installer.robot" 
                        '''
                        
                    }
                    else if(PASSWORD){
                        sh '''
                        sshpass -p "${PASSWORD}" ssh  "${PRIMARY_MASTER_IP}" -l "${USERNAME}" -o StrictHostKeyChecking=no "export PATH=$PATH:/var/lib/rancher/rke2/bin/;export PYTHONPATH=$(pwd);source py3/bin/activate; cd /tmp/robot/automation; python3 -m robot tests/system/rke2/rke2-installer.robot" 
                        '''
                        
                    }
                }
            }
           
        }
    }
   post {
        
        always{
            
            script{
                if (PKEY){
                    
                    sh """
                       
                        sshpass scp -i automation/keyfile.pem ${USERNAME}@${MASTER_IP}:/tmp/robot/automation/*html .
                        
                    """
                    
                } 
                else{
                        sh """
                            sshpass -p "${sqp_82536fd2050c2f9e4641d14578f8b42e48c74b29}" scp ${USERNAME}@${MASTER_IP}:/tmp/robot/automation/*html .
                        """
                }
                
            }
            
            archiveArtifacts allowEmptyArchive: true, artifacts: '*html', followSymlinks: false
        }
    }
}
.
