; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "owlcms4"
#define MyAppPublisher "Jean-François Lamy"
#define MyAppURL "https://jflamy.github.io/owlcms4"
#define MyAppExeName "owlcms.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{468BDCAA-2973-42CC-93FF-76EA762AF08E}
AppName={#MyAppName}
AppVersion={#%versionNumber}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={%USERPROFILE}\{#MyAppName}
DisableProgramGroupPage=yes
; The [Icons] "quicklaunchicon" entry uses {userappdata} but its [Tasks] entry has a proper IsAdminInstallMode Check.
UsedUserAreasWarning=no
; Remove the following line to run in administrative install mode (install for all users.)
PrivilegesRequired=lowest
SourceDir=..\..\..
OutputDir=target\owlcms_setup
OutputBaseFilename=owlcms_setup
SetupIconFile=src\main\install\owlcms.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
UsePreviousAppDir=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkablealone
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[InstallDelete]
; force update of JRE
Type: filesandordirs; Name: "{app}\jre"

[Files]
Source: "target\owlcms-win32\local\*"; DestDir: "{app}\local"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "target\owlcms-win32\classes\*"; DestDir: "{app}\classes"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "target\installtools\jre\*"; DestDir: "{app}\jre"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "target\owlcms-win32\*.exe"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "target\owlcms-win32\*.jar"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "target\owlcms-win32\*.ini"; DestDir: "{app}"; Flags: onlyifdoesntexist
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
