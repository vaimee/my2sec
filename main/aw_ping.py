import socket

def check(host,port,timeout=2):
    sock = socket.socket(socket.AF_INET,socket.SOCK_STREAM) #presumably
    sock.settimeout(timeout)
    try: sock.connect((host,port))
    except: return False
    else:
       sock.close()
       return True
