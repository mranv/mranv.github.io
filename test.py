import os
import time
import git

repo_path = '/home/mranv/Documents/GitHub/mranv.github.io/' 

os.chdir(repo_path)

repo = git.Repo(repo_path)

while True:
    # Make some changes to the repo
    with open('test.txt', 'a') as f:
        f.write('Hello World!\n')

    repo.git.add(all=True) 
    repo.index.commit('Automatic commit at ' + time.strftime('%Y-%m-%d %H:%M:%S')) 

    origin = repo.remote(name='origin')
    origin.push()

    time.sleep(2) # commit every minute