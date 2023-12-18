#/bin/bash

# The script is designed to make lsof run without having to input a password for sudo

# Variables
visudo_folder=/etc/sudoers.d
visudo_file=${visudo_folder}/firebase_kill_emulators
tempfolder=/tmp
visudoconfig="
Cmnd_Alias      LSOF = /usr/sbin/lsof -i
ALL ALL = NOPASSWD: LSOF
"

# Check if visudo file is correct, make it if not
function enable_visudo() {
    echo "Checking visudo file format"
    echo -e "$visudoconfig" >>$tempfolder/visudo.tmp
    sudo visudo -c -f $tempfolder/visudo.tmp >/dev/null 2>&1
    if [ "$?" -eq "0" ]; then
        echo "visudo file format is correct"
        if ! test -d "$visudo_folder"; then
            echo "Creating folder $visudo_folder"
            sudo mkdir -p "$visudo_folder"
        fi
        echo "Copying visudo file to $visudo_file"
        sudo cp $tempfolder/visudo.tmp $visudo_file
        rm $tempfolder/visudo.tmp
    else
        echo "visudo file format is incorrect, please check the file and try again"
        rm $tempfolder/visudo.tmp
        exit 1
    fi
    echo "Setting permissions on $visudo_file"
    sudo chmod 440 $visudo_file
}

# Check if visudo file exists, make it if not
if ! test -f "$visudo_file"; then
    enable_visudo
else
    echo "visudo file exists, doing nothing"
fi
