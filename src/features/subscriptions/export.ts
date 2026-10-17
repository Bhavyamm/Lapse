import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Hands the CSV to the phone's share sheet (Files, Mail, Drive…) or, on web, downloads it.
 * Resolves false when this device can't share files.
 */
export async function shareCsv(csv: string, filename: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Some browsers read the URL after click() returns.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }
  if (!(await Sharing.isAvailableAsync())) return false;
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export subscriptions',
  });
  return true;
}
