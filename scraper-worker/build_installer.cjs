const fs = require('fs');
const sed = `
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles
[Strings]
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=test.exe
FriendlyName=Test
AppLaunched=cmd.exe /c echo Hello World
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
[SourceFiles]
SourceFiles0=.
[SourceFiles0]
package.json
`;
fs.writeFileSync('test.sed', sed);
require('child_process').execSync('iexpress /n test.sed', { stdio: 'inherit' });
