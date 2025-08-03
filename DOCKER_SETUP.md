# Docker Setup for Supabase Functions

Supabase Edge Functions require Docker to be installed and running for local deployment.

## Install Docker

### macOS

1. **Download Docker Desktop**: 
   - Go to [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
   - Download the appropriate version (Intel or Apple Silicon)

2. **Install Docker Desktop**:
   - Open the downloaded `.dmg` file
   - Drag Docker to Applications
   - Launch Docker from Applications

3. **Verify Docker is Running**:
   ```bash
   docker --version
   docker ps
   ```

### Quick Install via Homebrew (macOS)
```bash
brew install --cask docker
open /Applications/Docker.app
```

## Start Docker

After installation, make sure Docker Desktop is running:
- Look for the Docker whale icon in your menu bar
- It should show "Docker Desktop is running"

## Deploy Functions After Docker is Running

Once Docker is running, you can deploy the functions:

```bash
# Deploy the main generation function
supabase functions deploy generate-llmstxt --no-verify-jwt

# Deploy the cron trigger function  
supabase functions deploy cron-trigger --no-verify-jwt
```

## Alternative: Deploy Without Docker

If you can't install Docker, you can deploy directly through the Supabase Dashboard:

1. Go to [Functions](https://supabase.com/dashboard/project/gytlhmhrthpackunppjd/functions)
2. Click "New Function"
3. Name it `generate-llmstxt`
4. Copy the contents of `functions/generate-llmstxt/index.ts`
5. Paste into the editor
6. Click "Deploy"
7. Repeat for `cron-trigger` function

## Troubleshooting

### Docker not starting on Mac
- Ensure you have enough disk space (at least 4GB)
- Try restarting your Mac
- Check System Preferences > Security & Privacy for any blocked software

### Permission issues
```bash
# Add your user to docker group
sudo dscl . append /Groups/docker GroupMembership $(whoami)
```

### Reset Docker (if needed)
- Docker Desktop > Preferences > Reset > Reset to factory defaults