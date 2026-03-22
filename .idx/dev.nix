# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
    pkgs.lsof      # పోర్ట్ చెక్ చేయడానికి (lsof కమాండ్ కోసం)
    pkgs.psmisc    # పోర్ట్ క్లియర్ చేయడానికి (fuser కమాండ్ కోసం)
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
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };

    # Preview settings
    previews = {
      enable = true;
      previews = {
        web = {
          # ఇక్కడ $PORT బదులు నేరుగా ఒక పోర్ట్ ఇవ్వడం కంటే, 
          # సిస్టమ్ ఇచ్చే డైనమిక్ పోర్ట్ వాడటం మంచిది.
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}