{pkgs, ...}: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.flutter
    pkgs.jdk17
    pkgs.lsof
    pkgs.psmisc
  ]; 
 
  # Sets environment variables in the workspace
  env = {};

  # This adds a file watcher to startup the firebase emulators.
  services.firebase.emulators = {
    detect = false;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };

  idx = {
    # VS Code extensions to install
    extensions = [
      "Dart-Code.dart-code"
      "Dart-Code.flutter"
    ];

    workspace = {
      onCreate = {
        # Optional: commands to run when the workspace is first created
      };
    };

    # Preview settings
    previews = {
      enable = true;
      previews = {
        web = {
          # Run the flutter web app on the provided port
          command = ["flutter" "run" "--machine" "-d" "web-server" "--web-hostname" "0.0.0.0" "--web-port" "$PORT"];
          manager = "web";
        };
      };
    }; 
  };
}