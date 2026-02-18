import { Audio } from 'expo-av';

export async function startRecording(): Promise<Audio.Recording | null> {
    try {
        const perm = await Audio.requestPermissionsAsync();
        if (perm.status !== 'granted') {
            console.log('Audio permission not granted');
            return null;
        }

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        console.log('Starting Recording..');
        return recording;
    } catch (err) {
        console.error('Failed to start recording', err);
        return null;
    }
}

export async function stopRecording(recording: Audio.Recording | null): Promise<string | null> {
    if (!recording) return null;

    try {
        console.log('Stopping Recording..');
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);
        return uri;
    } catch (error) {
        console.error('Failed to stop recording', error);
        return null;
    }
}
