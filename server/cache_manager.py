"""
File-based Cache Module
Stores API responses as JSON files for reuse.
"""
import os
import json
import hashlib
import time
from pathlib import Path

# Cache directory
CACHE_DIR = Path(__file__).parent / "cache"
CACHE_TTL = 7 * 24 * 60 * 60  # 7 days in seconds


def ensure_cache_dir():
    """Ensure cache directory exists."""
    if not CACHE_DIR.exists():
        CACHE_DIR.mkdir(parents=True)


def generate_cache_key(*args):
    """
    Generate a unique cache key from arguments.
    Uses MD5 hash of concatenated arguments.
    """
    combined = "::".join(str(arg) for arg in args)
    return hashlib.md5(combined.encode('utf-8')).hexdigest()


def get_cache_path(cache_key: str) -> Path:
    """Get file path for a cache key."""
    return CACHE_DIR / f"{cache_key}.json"


def get_cached(cache_key: str):
    """
    Get cached result if it exists and is not expired.
    
    Returns:
        Cached data or None if not found/expired
    """
    ensure_cache_dir()
    cache_path = get_cache_path(cache_key)
    
    if not cache_path.exists():
        return None
    
    try:
        with open(cache_path, 'r', encoding='utf-8') as f:
            cached = json.load(f)
        
        # Check if expired
        if time.time() - cached.get('timestamp', 0) > CACHE_TTL:
            # Delete expired cache
            cache_path.unlink()
            return None
        
        print(f"✅ Cache hit: {cache_key[:8]}...")
        return cached.get('data')
    except (json.JSONDecodeError, IOError):
        return None


def set_cache(cache_key: str, data):
    """
    Store data in cache.
    
    Args:
        cache_key: Unique identifier
        data: Data to cache (must be JSON serializable)
    """
    ensure_cache_dir()
    cache_path = get_cache_path(cache_key)
    
    try:
        cached = {
            'timestamp': time.time(),
            'data': data
        }
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(cached, f, ensure_ascii=False, indent=2)
        print(f"💾 Cached: {cache_key[:8]}...")
    except IOError as e:
        print(f"❌ Cache write error: {e}")


def clear_expired_cache():
    """Remove all expired cache files."""
    ensure_cache_dir()
    current_time = time.time()
    cleared = 0
    
    for cache_file in CACHE_DIR.glob("*.json"):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cached = json.load(f)
            
            if current_time - cached.get('timestamp', 0) > CACHE_TTL:
                cache_file.unlink()
                cleared += 1
        except (json.JSONDecodeError, IOError):
            # Delete corrupted cache files
            cache_file.unlink()
            cleared += 1
    
    if cleared > 0:
        print(f"🧹 Cleared {cleared} expired cache files")
    return cleared


def get_cache_stats():
    """Get cache statistics."""
    ensure_cache_dir()
    
    total_files = 0
    total_size = 0
    
    for cache_file in CACHE_DIR.glob("*.json"):
        total_files += 1
        total_size += cache_file.stat().st_size
    
    return {
        'total_files': total_files,
        'total_size_kb': round(total_size / 1024, 2),
        'total_size_mb': round(total_size / (1024 * 1024), 2)
    }
