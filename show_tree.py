import os
from pathlib import Path

def show_tree(directory='.', prefix='', output_file=None):
    """
    디렉토리 구조를 트리 형태로 출력하거나 파일에 저장합니다.
    
    Args:
        directory: 탐색할 디렉토리 경로 (기본값: 현재 디렉토리)
        prefix: 들여쓰기 접두사
        is_last: 현재 항목이 마지막 항목인지 여부
        output_file: 출력할 파일 객체 (None이면 화면 출력)
    """
    path = Path(directory)
    
    # 출력 함수 정의
    def write_line(text):
        if output_file:
            output_file.write(text + '\n')
        else:
            print(text)
    
    # 현재 디렉토리 이름 출력
    if prefix == '':
        write_line(f"📁 {path.absolute()}")
    
    try:
        # 디렉토리 내 모든 항목 가져오기
        items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
        
        for i, item in enumerate(items):
            if item.name == "node_modules" or item.name == ".git":
                continue

            is_last_item = (i == len(items) - 1)
            
            connector = '└── ' if is_last_item else '├── '
            icon = '📁' if item.is_dir() else '📄'
            
            # 현재 항목 출력
            write_line(f"{prefix}{connector}{icon} {item.name}")
            
            if item.is_dir() and item.name != "dist":
                # 다음 레벨의 접두사 설정
                extension = '    ' if is_last_item else '│   '
                show_tree(item, prefix + extension, output_file)
                
    except PermissionError:
        write_line(f"{prefix}    [접근 권한 없음]")

def save_tree_to_file(directory='.', output_filename='directory_tree.txt'):
    """
    디렉토리 구조를 파일로 저장합니다.
    Args:
        directory: 탐색할 디렉토리 경로
        output_filename: 저장할 파일 이름
    """
    with open(output_filename, 'w', encoding='utf-8') as f:
        f.write("디렉토리 구조:\n\n")
        show_tree(directory, output_file=f)
        f.write("\n")
    print(f"✅ 디렉토리 구조가 '{output_filename}' 파일에 저장되었습니다.")

# 실행
if __name__ == "__main__":
    print("\n디렉토리 구조:\n")
    # 파일로 저장
    save_tree_to_file(output_filename='directory_tree.txt')
    print()
    
    # 화면에 출력
    #show_tree()