export function humanize(str) {
  // Replace underscores with spaces
  str = str.replace(/_/g, ' ');

  // Add space before capital letters to split camelCase
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Split into words
  const words = str.split(' ');

  // Capitalize the first letter of each word, leave the rest as is
  const capitalizedWords = words.map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  // Join the words back together into a single string
  return capitalizedWords.join(' ');
}