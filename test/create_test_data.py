import zipfile
import os
from pathlib import Path

def create_test_skill_zips():
    base_dir = Path(__file__).parent
    skills_dir = base_dir / "skills"
    
    for skill_folder in skills_dir.iterdir():
        if skill_folder.is_dir():
            zip_path = base_dir / f"{skill_folder.name}.zip"
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in skill_folder.rglob('*'):
                    if file_path.is_file():
                        arcname = file_path.relative_to(skill_folder)
                        zipf.write(file_path, arcname)
            print(f"Created {zip_path}")

if __name__ == "__main__":
    create_test_skill_zips()
