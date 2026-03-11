import requests
from bs4 import BeautifulSoup

url = "https://github.com/GoogleChrome/chrome-extensions-samples/issues"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Find issue elements
issues = soup.find_all('div', {'data-testid': 'issue-title'})
print(f"Found {len(issues)} issues")

# Look for the issue containers
issue_containers = soup.select('div[id^="issue_"]')
print(f"\nFound {len(issue_containers)} issue containers with id^='issue_'")

# Look for list items
list_items = soup.select('li[id^="issue_"]')
print(f"\nFound {len(list_items)} list items with id^='issue_'")

# Look for the main issue list
issue_list = soup.find('div', {'data-testid': 'issue-list'})
if issue_list:
    print("\nFound issue-list container")
    children = issue_list.find_all('div', recursive=False)
    print(f"Direct children: {len(children)}")
    
# Print the structure of first issue
if list_items:
    print("\n--- Structure of first issue item ---")
    first_issue = list_items[0]
    
    # Find title
    title_elem = first_issue.find('a', {'data-hovercard-type': 'issue'})
    if title_elem:
        print(f"Title: {title_elem.text.strip()}")
        print(f"Title href: {title_elem.get('href')}")
    
    # Find status
    status_elem = first_issue.find('span', {'title': True})
    if status_elem:
        print(f"Status: {status_elem.get('title')}")
    
    # Find author
    author_elem = first_issue.find('a', {'data-hovercard-type': 'user'})
    if author_elem:
        print(f"Author: {author_elem.text.strip()}")
    
    # Find date
    time_elem = first_issue.find('relative-time')
    if time_elem:
        print(f"Date: {time_elem.get('datetime')}")
        print(f"Date text: {time_elem.text}")

    # Find issue number
    issue_id = first_issue.get('id')
    if issue_id:
        print(f"Issue ID element: {issue_id}")

# Print some HTML to understand the structure
print("\n--- Sample HTML ---")
if list_items:
    print(str(list_items[0])[:2000])
