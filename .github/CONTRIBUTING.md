# Contributing to LoRaDB-UI

## Development Workflow

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/loradb-ui.git
cd loradb-ui

# Copy environment file
cp .env.example .env

# Start development environment (builds locally)
docker compose up -d

# View logs
docker compose logs -f

# Make changes to code...

# Rebuild after changes
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Testing Changes

```bash
# Backend type checking
cd backend
npm run type-check

# Frontend type checking
cd frontend
npm run type-check

# Or use Docker builds to test
docker compose build
```

## Release Process

### 1. Version Bump

Update version numbers if needed (optional, can use Git tags):
- `backend/package.json`
- `frontend/package.json`

### 2. Create and Push Tag

```bash
# Create a new version tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to GitHub
git push origin v1.0.0
```

### 3. Automated Build

GitHub Actions will automatically:
1. Build Docker images for both backend and frontend
2. Push to GitHub Container Registry with tags:
   - `v1.0.0` (exact version)
   - `v1.0` (latest patch)
   - `v1` (latest minor)
   - `latest` (latest stable)

### 4. Monitor Build

- Go to GitHub repository → Actions tab
- Watch the "Build and Push Docker Images" workflow
- Verify both images are built successfully

### 5. Verify Images

```bash
# Pull and test the new images
docker pull ghcr.io/yourusername/loradb-ui/backend:v1.0.0
docker pull ghcr.io/yourusername/loradb-ui/frontend:v1.0.0

# Test with docker-compose
echo "IMAGE_TAG=v1.0.0" >> .env
docker compose -f docker-compose.ghcr.yml up -d
```

## Continuous Integration

### Main Branch

Every push to `main` triggers:
- Build of both images
- Push to GHCR with tags: `latest`, `main`, `main-<sha>`

### Pull Requests

Pull requests trigger:
- Build of both images (validation)
- No push to registry (testing only)

### Manual Dispatch

Trigger builds manually:
1. Go to repository → Actions
2. Select "Build and Push Docker Images"
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow"

## Making Images Public

By default, GHCR images are private. To make them public:

1. Go to repository on GitHub
2. Click "Packages" on the right sidebar
3. Click on package (backend or frontend)
4. Click "Package settings"
5. Scroll to "Danger Zone"
6. Click "Change visibility" → "Public"
7. Confirm
8. Repeat for both packages

## Troubleshooting CI/CD

### Build Fails

Check GitHub Actions logs:
1. Go to repository → Actions
2. Click on failed workflow run
3. Click on failed job
4. Review error messages

Common issues:
- TypeScript errors → Fix in code
- Docker build errors → Check Dockerfile
- Permission errors → Verify GITHUB_TOKEN permissions

### Images Not Pushing

- Verify repository has packages write permission
- Check workflow file permissions section
- Ensure GITHUB_TOKEN is available

### Wrong Image Tags

- Check git tag format (must be `v*.*.*`)
- Verify workflow trigger conditions
- Review metadata-action configuration

## Code Style

- Backend: TypeScript with strict mode
- Frontend: React with TypeScript
- Follow existing patterns in codebase
- Run type checks before committing

## Commit Messages

Use conventional commits format:

```
feat: add new dashboard widget type
fix: resolve authentication bug
docs: update deployment guide
chore: update dependencies
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test locally with docker-compose
5. Create pull request to `main`
6. Wait for CI checks to pass
7. Request review

## Questions?

- Open an issue on GitHub
- Check existing documentation
- Review DEPLOYMENT.md for production setup
