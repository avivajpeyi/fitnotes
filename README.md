# Legacy FitNotes repository

The active Android application is now **[FitLogs](https://github.com/fit-logs/fitlogs)**.
Download updates from the [FitLogs stable releases](https://github.com/fit-logs/fitlogs/releases/latest).

This repository preserves the old Android snapshot, beta releases and experimental webapp. New Android development and publishing belong in `fit-logs/fitlogs`; the Android publishing workflow here is retired.

## Moving an installed app

Install the new repository's **fitnotes.apk** over the existing app once. Keep the current application installed and retain its data. FitLogs uses the same `com.example.fitnotes` application ID and original signing certificate, with a higher version code.

The old local app displaying **1.1 (2)** only checks the former repository and ignores pre-releases. It cannot discover the repository transition automatically. After the manual migration installation, **Settings → Update app** checks the new repository's stable releases. Android still asks for installation confirmation.

The historical beta.1 and beta.2 APKs remain available here for reference. This repository remains unarchived during the transition; archiving is a later action.
