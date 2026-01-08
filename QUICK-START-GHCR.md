# Quick Start: GitHub Container Registry Deployment

## One-Time Setup (5 minutes)

### 1. Enable GitHub Actions

```bash
# Commit and push the GitHub Actions workflow
git add .github/workflows/docker-publish.yml
git commit -m "Add GitHub Actions workflow for GHCR"
git push origin main
```

GitHub Actions will automatically build and push images on every push to `main`.

### 2. Make Images Public (Optional)

If you want public images (so anyone can pull without authentication):

1. Go to https://github.com/justdr00py/loradb-ui
2. Click "Packages" on the right sidebar
3. Click "backend" package → Settings → Change visibility to Public
4. Click "frontend" package → Settings → Change visibility to Public

**If images are private:** Users need GitHub token to pull:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u justdr00py --password-stdin
```

### 3. Create a Release Tag

```bash
# Tag your first release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

This triggers an automated build with version tags:
- `ghcr.io/justdr00py/loradb-ui/backend:v1.0.0`
- `ghcr.io/justdr00py/loradb-ui/backend:v1.0`
- `ghcr.io/justdr00py/loradb-ui/backend:v1`
- `ghcr.io/justdr00py/loradb-ui/backend:latest`

(Same for frontend)

---

## Deployment on Any Server (2 minutes)

### Quick Deploy

```bash
# 1. Create deployment directory
mkdir -p ~/loradb-ui && cd ~/loradb-ui

# 2. Download docker-compose file
curl -O https://raw.githubusercontent.com/justdr00py/loradb-ui/main/docker-compose.ghcr.yml

# 3. Create environment file
cat > .env << 'EOF'
GITHUB_REPOSITORY=justdr00py/loradb-ui
IMAGE_TAG=latest
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://localhost:3000
EOF

# 4. Pull and start
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d

# 5. Check logs
docker compose -f docker-compose.ghcr.yml logs -f
```

### Access

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## Update to Latest Version (30 seconds)

```bash
cd ~/loradb-ui

# Pull latest images
docker compose -f docker-compose.ghcr.yml pull

# Recreate containers with new images
docker compose -f docker-compose.ghcr.yml up -d

# Check logs
docker compose -f docker-compose.ghcr.yml logs -f
```

---

## Using Specific Versions

Edit `.env`:

```bash
# Use latest stable (default)
IMAGE_TAG=latest

# Use specific version
IMAGE_TAG=v1.0.0

# Use latest 1.x version
IMAGE_TAG=v1

# Use development (main branch)
IMAGE_TAG=main
```

Then update:

```bash
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

---

## Development Workflow

### Local Changes

```bash
# Make code changes...

# Build locally for testing
docker compose up -d

# Test your changes...
```

### Create Release

```bash
# Commit your changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Tag a new version
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# GitHub Actions automatically builds and publishes
# Wait ~5 minutes for build to complete
```

### Deploy New Version

```bash
# On any server
cd ~/loradb-ui
echo "IMAGE_TAG=v1.1.0" >> .env
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

---

## Monitoring Builds

1. Go to https://github.com/justdr00py/loradb-ui/actions
2. See workflow runs
3. Click on a run to see detailed logs
4. Green checkmark = success, images are published

---

## Advantages of This Setup

✅ **No Build Time** - Pull pre-built images in seconds
✅ **Consistent** - Same images across all deployments
✅ **Automated** - Push code → automatic build → ready to deploy
✅ **Versioned** - Easy rollback to previous versions
✅ **Multi-Platform** - Supports amd64 and arm64 (Raspberry Pi!)
✅ **Bandwidth Efficient** - Download once, reuse everywhere

---

## Complete Documentation

- **Full Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Contributing**: [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)
- **Main README**: [README.md](README.md)

---

## Troubleshooting

### Can't Pull Images

**Public images**: Works immediately
**Private images**: Need authentication
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u justdr00py --password-stdin
```

### Build Failed

Check https://github.com/justdr00py/loradb-ui/actions for error logs

### Wrong Version

Check which tags are available:
```bash
docker pull ghcr.io/justdr00py/loradb-ui/backend:latest
docker pull ghcr.io/justdr00py/loradb-ui/backend:v1.0.0
docker pull ghcr.io/justdr00py/loradb-ui/backend:main
```

---

## Summary

**Initial Setup** (once):
1. Push workflow to GitHub
2. Create a release tag
3. Wait for build to complete (~5 min)

**Deploy Anywhere** (any server):
1. `curl` docker-compose file
2. Create `.env` with JWT secret
3. `docker compose pull && up -d`

**Update** (any server):
1. Change `IMAGE_TAG` in `.env`
2. `docker compose pull && up -d`

That's it! 🚀
