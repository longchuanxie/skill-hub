"""
Test Skill 1 - Main Module
A simple test skill for integration testing.
"""

def test_function():
    """
    A basic test function that returns a greeting message.
    
    Returns:
        str: A greeting message
    """
    return "Hello from Test Skill 1!"

def add_numbers(a: int, b: int) -> int:
    """
    Add two numbers together.
    
    Args:
        a (int): First number
        b (int): Second number
    
    Returns:
        int: Sum of a and b
    """
    return a + b

def get_skill_info():
    """
    Get information about this skill.
    
    Returns:
        dict: Skill information
    """
    return {
        "name": "test-skill-1",
        "version": "1.0.0",
        "description": "A test skill for integration testing"
    }

if __name__ == "__main__":
    print(test_function())
    print(f"2 + 3 = {add_numbers(2, 3)}")
    print(f"Skill info: {get_skill_info()}")
