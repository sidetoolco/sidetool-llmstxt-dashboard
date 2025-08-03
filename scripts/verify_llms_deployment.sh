#!/bin/bash

# Verify LLMs.txt Deployment Script
# Checks if llms.txt files are properly deployed and accessible

echo "🔍 Verifying LLMs.txt deployment for sidetool.co..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs to check
LLMS_URL="https://sidetool.co/llms.txt"
LLMS_FULL_URL="https://sidetool.co/llms-full.txt"

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name: "
    
    # Get HTTP status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "200" ]; then
        # Get file size
        size=$(curl -s "$url" | wc -c)
        size_kb=$((size / 1024))
        
        echo -e "${GREEN}✓${NC} Available (${size_kb} KB)"
        
        # Check content
        echo "  Sample content:"
        curl -s "$url" | head -n 5 | sed 's/^/    /'
        
        return 0
    elif [ "$status_code" = "404" ]; then
        echo -e "${RED}✗${NC} Not found (404)"
        return 1
    else
        echo -e "${YELLOW}⚠${NC} Unexpected status: $status_code"
        return 1
    fi
}

# Check both files
echo ""
check_url "$LLMS_URL" "llms.txt"
llms_status=$?

echo ""
check_url "$LLMS_FULL_URL" "llms-full.txt"
llms_full_status=$?

# Check if files are fresh (updated within last 25 hours)
echo ""
echo "Checking freshness..."

if [ $llms_status -eq 0 ]; then
    # Get Last-Modified header
    last_modified=$(curl -sI "$LLMS_URL" | grep -i "last-modified" | cut -d' ' -f2-)
    if [ -n "$last_modified" ]; then
        echo "  Last modified: $last_modified"
        
        # Convert to timestamp
        modified_timestamp=$(date -d "$last_modified" +%s 2>/dev/null || date -j -f "%a, %d %b %Y %H:%M:%S %Z" "$last_modified" +%s 2>/dev/null)
        current_timestamp=$(date +%s)
        
        if [ -n "$modified_timestamp" ]; then
            age_hours=$(( (current_timestamp - modified_timestamp) / 3600 ))
            
            if [ $age_hours -lt 25 ]; then
                echo -e "  ${GREEN}✓${NC} Files are fresh (updated $age_hours hours ago)"
            else
                echo -e "  ${YELLOW}⚠${NC} Files may be stale (updated $age_hours hours ago)"
            fi
        fi
    fi
fi

# Test LLM discoverability
echo ""
echo "Testing LLM discoverability..."

# Check robots.txt
robots_url="https://sidetool.co/robots.txt"
echo -n "  Checking robots.txt: "
if curl -s "$robots_url" | grep -q "llms.txt"; then
    echo -e "${GREEN}✓${NC} Referenced in robots.txt"
else
    echo -e "${YELLOW}⚠${NC} Not referenced in robots.txt (optional but recommended)"
fi

# Check if files contain expected content
if [ $llms_status -eq 0 ]; then
    echo -n "  Checking content structure: "
    if curl -s "$LLMS_URL" | grep -q "URL:"; then
        echo -e "${GREEN}✓${NC} Proper format detected"
    else
        echo -e "${RED}✗${NC} Format issues detected"
    fi
fi

# Summary
echo ""
echo "================================================"
echo "Summary:"

if [ $llms_status -eq 0 ] && [ $llms_full_status -eq 0 ]; then
    echo -e "${GREEN}✅ Both LLMs.txt files are properly deployed!${NC}"
    echo ""
    echo "Files are accessible at:"
    echo "  • $LLMS_URL"
    echo "  • $LLMS_FULL_URL"
    echo ""
    echo "LLMs like ChatGPT and Perplexity can now discover and index your content."
else
    echo -e "${RED}❌ Deployment issues detected${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Ensure files exist in /public directory"
    echo "  2. Check GitHub Actions workflow status"
    echo "  3. Verify Vercel deployment settings"
    echo "  4. Ensure sidetool.co serves files from /public"
fi

echo ""
echo "For more information, see:"
echo "  • https://github.com/sidetoolco/sidetool-llmstxt-dashboard/actions"
echo "  • https://vercel.com/sidetool/sidetool-co/deployments"