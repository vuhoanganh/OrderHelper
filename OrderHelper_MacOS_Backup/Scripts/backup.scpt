-- Main backup script for Order Helper
property htmlPath : "/Users/alvin/Desktop/Kitchen/order_helper_v3_advanced.html"
property destDir : "/Users/alvin/Library/Mobile Documents/com~apple~CloudDocs/Kitchen"
property logFile : "/Users/alvin/Desktop/Kitchen/backup.log"
property cleanupScript : "/Users/alvin/Desktop/Kitchen/OrderHelper_MacOS_Backup/Scripts/cleanup.scpt"

on logMessage(theMessage)
	set ts to do shell script "date +'[%Y-%m-%d %H:%M:%S]'"
	do shell script "echo " & quoted form of (ts & " " & theMessage) & " >> " & quoted form of logFile
end logMessage

on notify(titleText, bodyText)
	try
		display notification bodyText with title titleText
	end try
end notify

	on run
	try
		logMessage("Backup start")

		set targetTab to missing value
		
		-- Sanity checks
		do shell script "test -f " & quoted form of htmlPath
		do shell script "mkdir -p " & quoted form of destDir
		
		set fileURL to "file://" & htmlPath & "?autobackup=true"
		
		tell application "Safari"
			if not (exists window 1) then
				set targetTab to make new document with properties {URL:fileURL}
			else
				set targetTab to make new tab at end of tabs of window 1 with properties {URL:fileURL}
				set current tab of window 1 to targetTab
			end if
			delay 3
			set jsResult to do JavaScript "JSON.stringify(exportForAutomation({download:false, silent:true}))" in targetTab
		end tell
		
		if jsResult is missing value or jsResult is "" then error "Không nhận được dữ liệu từ trang."
		
		-- Write JSON via Python for reliable handling
		set writeCmd to "python3 - <<'PY'\nimport json, os, sys, pathlib\nraw = " & quoted form of jsResult & "\ntry:\n    data = json.loads(raw)\nexcept Exception as exc:\n    print('ERROR', exc)\n    sys.exit(2)\ncontent = data.get('content', '') if isinstance(data, dict) else ''\nfilename = data.get('filename') if isinstance(data, dict) else None\nif not filename:\n    import datetime\n    filename = 'order_history_' + datetime.date.today().isoformat() + '.json'\nbase = " & quoted form of destDir & "\npath = pathlib.Path(base) / filename\npath.parent.mkdir(parents=True, exist_ok=True)\npath.write_text(content, encoding='utf-8')\nprint(path)\nprint(len(content))\nPY"
		
		set writeOutput to do shell script writeCmd
		set backupPath to paragraph 1 of writeOutput
		set byteCount to paragraph 2 of writeOutput
		
		if byteCount is "0" then error "File backup trống."
		
		logMessage("Backup thành công: " & backupPath & " (" & byteCount & " bytes)")
		
		-- Cleanup rotation
		try
			do shell script "/usr/bin/osascript " & quoted form of cleanupScript
		on error errText
			logMessage("Cleanup lỗi: " & errText)
		end try
		
		-- Close only the tab we opened (quit if nothing left)
		try
			tell application "Safari"
				if targetTab is not missing value then close targetTab
				if (count of documents) = 0 then quit
			end tell
		end try
		
		notify("Order Helper Backup", "✅ Backup thành công - " & backupPath)
	on error errMsg number errNum
		logMessage("Backup thất bại: " & errMsg & " (code " & errNum & ")")
		notify("Order Helper Backup", "❌ Backup thất bại - " & errMsg)
		error errMsg
	end try
end run
