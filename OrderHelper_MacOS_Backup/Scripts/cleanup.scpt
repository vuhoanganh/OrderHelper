-- Cleanup script to keep only newest 30 backup files
property destDir : "/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen"
property logFile : "/Users/alvin/Desktop/Kitchen/backup.log"

on logMessage(theMessage)
	set ts to do shell script "date +'[%Y-%m-%d %H:%M:%S]'"
	do shell script "echo " & quoted form of (ts & " " & theMessage) & " >> " & quoted form of logFile
end logMessage

on run
	try
		logMessage("Cleanup start")
		do shell script "mkdir -p " & quoted form of destDir
		
		set cleanupCmd to "python3 - <<'PY'\nimport pathlib, os, sys\nbase = pathlib.Path(" & quoted form of destDir & ")\nfiles = sorted(base.glob('order_history_*.json'), key=lambda p: p.stat().st_ctime)\ncount = len(files)\nprint('COUNT', count)\nif count <= 30:\n    sys.exit(0)\nremove_count = count - 30\nfor p in files[:remove_count]:\n    print('DEL', p)\n    try:\n        p.unlink()\n    except Exception as exc:\n        print('ERR', p, exc)\nPY"
		
		set pyOutput to do shell script cleanupCmd
		set outputLines to paragraphs of pyOutput
		repeat with ln in outputLines
			if ln starts with "DEL " then
				set targetPath to text 5 thru -1 of ln
				logMessage("Đã xoá backup cũ: " & targetPath)
			else if ln starts with "ERR " then
				logMessage("Lỗi xoá file: " & ln)
			end if
		end repeat
		
		logMessage("Cleanup done")
	on error errMsg number errNum
		logMessage("Cleanup thất bại: " & errMsg & " (code " & errNum & ")")
		error errMsg
	end try
end run
