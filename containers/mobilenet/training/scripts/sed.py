import os


def replace_words(old_word, new_word, file_path):
    """
    Replaces content of a file with new content
    Args:
        old_word: content to be replaced
        new_word: content to replace with
        file_path: the file that needs content replaced

    Returns:
        None
    """
    fin = open(os.path.join(os.getcwd(), file_path), 'r')
    lines = fin.readlines()
    fin.close()
    fout = open(os.path.join(os.getcwd(), file_path), 'w')
    for line in lines:
        line = line.replace(old_word, new_word)
        fout.write(line)
    fout.close()
