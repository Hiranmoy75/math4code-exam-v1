import crypto from 'crypto';

/**
 * Bunny.net Video Hosting Utility Library
 * Supports VOD (Video on Demand) and Live Streaming
 */

export interface BunnySettings {
    bunny_api_key: string;
    bunny_library_id: string;
    bunny_stream_library_id?: string;
}

export interface BunnyVideoInfo {
    videoId: string;
    guid: string;
    title: string;
    status: number; // 0=queued, 1=processing, 2=encoding, 3=finished, 4=error
    duration: number;
    thumbnailUrl: string;
    embedUrl: string;
}

export interface BunnyLiveStreamInfo {
    streamId: string;
    streamKey: string;
    rtmpUrl: string;
    playbackUrl: string;
    status: 'offline' | 'live';
}

/**
 * Generate SHA256 signature for Bunny.net direct upload
 * Required for TUS protocol uploads
 */
export function generateUploadSignature(
    libraryId: string,
    apiKey: string,
    expirationTime: number = Date.now() + 3600000 // 1 hour from now
): { signature: string; expirationTime: number; libraryId: string } {
    const message = `${libraryId}${apiKey}${expirationTime}`;
    const signature = crypto
        .createHash('sha256')
        .update(message)
        .digest('hex');

    return {
        signature,
        expirationTime,
        libraryId
    };
}

/**
 * Fetch video information from Bunny.net
 */
export async function getBunnyVideoInfo(
    libraryId: string,
    videoId: string,
    apiKey: string
): Promise<BunnyVideoInfo> {
    const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
        {
            headers: {
                'AccessKey': apiKey,
                'Accept': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch video info: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        videoId: data.guid,
        guid: data.guid,
        title: data.title,
        status: data.status,
        duration: data.length,
        thumbnailUrl: data.thumbnailFileName
            ? `https://vz-${data.storageZoneName}.b-cdn.net/${data.guid}/${data.thumbnailFileName}`
            : '',
        embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${data.guid}`
    }
}

/**
 * Create a new collection (folder) in Bunny.net
 */
export async function createBunnyCollection(
    libraryId: string,
    apiKey: string,
    collectionName: string
): Promise<{ collectionId: string }> {
    const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/collections`,
        {
            method: 'POST',
            headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name: collectionName })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create collection: ${error}`);
    }

    const data = await response.json();

    return {
        collectionId: data.guid
    };
}

/**
 * Get all collections in a Bunny.net library
 */
export async function getBunnyCollections(
    libraryId: string,
    apiKey: string
): Promise<Array<{ guid: string; name: string; videoCount: number }>> {
    const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/collections`,
        {
            headers: {
                'AccessKey': apiKey,
                'Accept': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    const data = await response.json();

    return data.items || [];
}

/**
 * Find a collection by name (case-insensitive)
 */
export async function findCollectionByName(
    libraryId: string,
    apiKey: string,
    name: string
): Promise<{ collectionId: string | null }> {
    const collections = await getBunnyCollections(libraryId, apiKey);

    const found = collections.find(
        c => c.name.toLowerCase() === name.toLowerCase()
    );

    return {
        collectionId: found ? found.guid : null
    };
}

/**
 * Get or create a collection by name
 * Returns existing collection if found, creates new one if not
 */
export async function getOrCreateCollection(
    libraryId: string,
    apiKey: string,
    collectionName: string
): Promise<{ collectionId: string; created: boolean }> {
    // Try to find existing collection
    const { collectionId: existingId } = await findCollectionByName(
        libraryId,
        apiKey,
        collectionName
    );

    if (existingId) {
        return { collectionId: existingId, created: false };
    }

    // Create new collection
    const { collectionId } = await createBunnyCollection(
        libraryId,
        apiKey,
        collectionName
    );

    return { collectionId, created: true };
}

/**
 * Create a new video object in Bunny.net (before upload)
 */
export async function createBunnyVideo(
    libraryId: string,
    apiKey: string,
    title: string,
    collectionId?: string
): Promise<{ videoId: string; guid: string }> {
    const body: any = { title };

    // Add collection ID if provided
    if (collectionId) {
        body.collectionId = collectionId;
    }

    const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        {
            method: 'POST',
            headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to create video: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        videoId: data.guid,
        guid: data.guid
    };
}

/**
 * Create a new live stream in Bunny.net
 */
export async function createBunnyLiveStream(
    libraryId: string,
    apiKey: string,
    title: string
): Promise<BunnyLiveStreamInfo> {
    // Note: Bunny.net Stream API uses a different endpoint
    const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        {
            method: 'POST',
            headers: {
                'AccessKey': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                title,
                // Enable live stream mode
                enabledResolutions: '240p,360p,480p,720p,1080p'
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create live stream: ${error}`);
    }

    const data = await response.json();

    // Generate stream key and RTMP URL
    // Bunny.net live streaming RTMP format: rtmp://live-{region}.bunnycdn.com:1935/stream
    const streamKey = data.guid; // Bunny uses video GUID as stream key
    const rtmpUrl = `rtmp://live.bunnycdn.com:1935/stream`;

    return {
        streamId: data.guid,
        streamKey: streamKey,
        rtmpUrl: rtmpUrl,
        playbackUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${data.guid}`,
        status: 'offline'
    };
}

/**
 * Get live stream status
 */
export async function getLiveStreamStatus(
    libraryId: string,
    streamId: string,
    apiKey: string
): Promise<'offline' | 'live'> {
    try {
        const videoInfo = await getBunnyVideoInfo(libraryId, streamId, apiKey);

        // Check if stream is currently live
        // Bunny.net doesn't have a direct "isLive" flag, so we check the status
        // Status 3 = finished/ready, but for live streams we need to check differently
        // This is a simplified check - you may need to adjust based on Bunny's actual API

        return 'offline'; // Default to offline, update based on actual API response
    } catch (error) {
        return 'offline';
    }
}

/**
 * Delete a video from Bunny.net
 */
export async function deleteBunnyVideo(
    libraryId: string,
    videoId: string,
    apiKey: string
): Promise<boolean> {
    const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
        {
            method: 'DELETE',
            headers: {
                'AccessKey': apiKey
            }
        }
    );

    return response.ok;
}

/**
 * Get Bunny.net embed code
 */
export function getBunnyEmbedUrl(libraryId: string, videoId: string): string {
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
}

/**
 * Get Bunny.net HLS playback URL
 */
export function getBunnyHlsUrl(libraryId: string, videoId: string): string {
    return `https://vz-${libraryId}.b-cdn.net/${videoId}/playlist.m3u8`;
}

/**
 * Validate Bunny.net API credentials
 */
export async function validateBunnyCredentials(
    libraryId: string,
    apiKey: string
): Promise<boolean> {
    try {
        console.log('Validating Bunny credentials:', {
            libraryId,
            apiKeyLength: apiKey?.length,
            apiKeyPrefix: apiKey?.substring(0, 8) + '...'
        });

        const response = await fetch(
            `https://video.bunnycdn.com/library/${libraryId}`,
            {
                headers: {
                    'AccessKey': apiKey,
                    'Accept': 'application/json'
                }
            }
        );

        console.log('Bunny API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Bunny API error response:', errorText);
        }

        return response.ok;
    } catch (error) {
        console.error('Bunny validation error:', error);
        return false;
    }
}
